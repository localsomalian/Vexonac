import { randomUUID } from "crypto";
import type {
  Guild,
  GuildMember,
  Interaction,
  Message,
  ButtonInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import {
  ActionRowBuilder,
  ActivityType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  DiscordAPIError,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "discord.js";
import prisma from "../../prisma";
import discordBotConfig from "./discord-bot.config";
import { discordUserService } from "../services/discord-user.service";
import { DiscountType, type IdentifierType } from "@vexonac/database";

function parseIdentifierType(identifier: string): IdentifierType {
  if (identifier.startsWith("steam:"))   return "STEAM";
  if (identifier.startsWith("license:")) return "ROCKSTAR";
  if (identifier.startsWith("license2:")) return "ROCKSTAR2";
  if (identifier.startsWith("discord:")) return "DISCORD";
  if (identifier.startsWith("xbox:") || identifier.startsWith("xbl:")) return "XBOX";
  if (identifier.startsWith("live:"))    return "MICROSOFT";
  if (identifier.startsWith("fivem:"))   return "FIVEM";
  if (identifier.startsWith("fid:"))     return "FINGERPRINT";
  if (identifier.startsWith("sid:") || identifier.startsWith("sid2:")) return "STORAGE";
  if (identifier.includes("ip:"))        return "IP";
  return "HWID";
}

// Define LicenseType enum to match the Prisma schema
type LicenseType =
  | "TRIAL"
  | "MONTHLY"
  | "QUARTERLY"
  | "BIANUALLY"
  | "YEARLY"
  | "LIFETIME";

class DiscordBotService {
  private client: Client;
  private commands: any[] = [];
  private statusUpdateInterval: NodeJS.Timeout | null = null;

  // Moderation state (in-memory; resets on server restart)
  private warns = new Map<string, string[]>(); // userId → reasons[]
  private spamTracker = new Map<string, { count: number; resetAt: number }>();
  private recentJoins: number[] = [];
  private raidMode = false;

  // Ticket state: channelId → ticket info
  private openTickets = new Map<string, {
    userId: string;
    username: string;
    category: string;
    openedAt: Date;
    claimedBy?: string;
    claimedByTag?: string;
  }>();

  // Staff ticket stats: userId → { claimed, closed }
  private staffStats = new Map<string, { claimed: number; closed: number; tag: string }>();

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.registerCommands();
    this.setupEventHandlers();
  }

  private registerCommands() {
    // Ban command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a license key")
        .addStringOption((option) =>
          option
            .setName("license_key")
            .setDescription("The license key to ban")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for banning")
            .setRequired(true)
        )
    );

    // Unban command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a license key")
        .addStringOption((option) =>
          option
            .setName("license_key")
            .setDescription("The license key to unban")
            .setRequired(true)
        )
    );

    // Check Ban command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("checkban")
        .setDescription("Check if a license key is banned")
        .addStringOption((option) =>
          option
            .setName("license_key")
            .setDescription("The license key to check")
            .setRequired(true)
        )
    );

    // Reset IP command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("resetip")
        .setDescription("Reset IP for a license key")
        .addStringOption((option) =>
          option
            .setName("license_key")
            .setDescription("The license key to reset IP for")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for manual IP reset")
            .setRequired(false)
        )
    );

    // Create version command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("createversion")
        .setDescription("Create a new version")
        .addStringOption((option) =>
          option
            .setName("version")
            .setDescription("The version to create")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("changelog")
            .setDescription("Version changelog")
            .setRequired(false)
        )
    );

    // Generate command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("generate")
        .setDescription("Generate new license keys")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("License type")
            .setRequired(true)
            .addChoices(
              { name: "Trial", value: "TRIAL" },
              { name: "Monthly", value: "MONTHLY" },
              { name: "Quarterly", value: "QUARTERLY" },
              { name: "Bi-Annually", value: "BIANUALLY" },
              { name: "Yearly", value: "YEARLY" },
              { name: "Lifetime", value: "LIFETIME" }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Number of keys to generate")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(40)
        )
    );

    // Create discount command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("creatediscount")
        .setDescription("Create a new discount code")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("Discount code (3-20 alphanumeric characters)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Discount type")
            .setRequired(true)
            .addChoices(
              { name: "Percentage", value: "PERCENTAGE" },
              { name: "Fixed Amount", value: "FIXED_AMOUNT" }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("value")
            .setDescription("Discount value (percentage 1-100 or fixed amount in EUR)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(250)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("Discount description")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("auto_apply")
            .setDescription("Auto-apply this discount (shown automatically)")
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("expires_in_days")
            .setDescription("Number of days until expiration (leave empty for no expiration)")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(365)
        )
    );

    // Delete discount command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("deletediscount")
        .setDescription("Delete a discount code")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("Discount code to delete")
            .setRequired(true)
        )
    );

    // List discounts command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("listdiscounts")
        .setDescription("List all active discount codes")
        .addBooleanOption((option) =>
          option
            .setName("include_expired")
            .setDescription("Include expired discounts")
            .setRequired(false)
        )
    );

    // Toggle discount command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("togglediscount")
        .setDescription("Enable or disable a discount code")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("Discount code to toggle")
            .setRequired(true)
        )
    );

    // Sync roles command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("syncroles")
        .setDescription("Sync customer roles for all valid license holders")
    );

    // Sync members command
    this.commands.push(
      new SlashCommandBuilder()
        .setName("syncmembers")
        .setDescription("Attempt to join all users with linked Discord accounts to the server")
    );

    // ── Moderation commands ───────────────────────────────────────

    this.commands.push(
      new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a member (3=mute, 5=kick, 7=ban)")
        .addUserOption((o) => o.setName("user").setDescription("Member to warn").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(true))
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("warns")
        .setDescription("View warnings for a member")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("clearwarns")
        .setDescription("Clear all warnings for a member")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Timeout a member")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addIntegerOption((o) =>
          o
            .setName("minutes")
            .setDescription("Duration in minutes (max 10080 = 7 days)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10080)
        )
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false))
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Remove timeout from a member")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("raidmode")
        .setDescription("Toggle raid protection mode manually")
        .addStringOption((o) =>
          o
            .setName("state")
            .setDescription("on or off")
            .setRequired(true)
            .addChoices({ name: "On", value: "on" }, { name: "Off", value: "off" })
        )
    );

    // ── Player commands ───────────────────────────────────────────

    this.commands.push(
      new SlashCommandBuilder()
        .setName("playerban")
        .setDescription("Ban a game player across all VexonAC servers by identifier")
        .addStringOption((o) =>
          o
            .setName("identifier")
            .setDescription("steam:xxx / license:xxx / discord:xxx / fivem:xxx")
            .setRequired(true)
        )
        .addStringOption((o) => o.setName("reason").setDescription("Ban reason").setRequired(true))
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("playerunban")
        .setDescription("Remove a game ban by ban ID")
        .addStringOption((o) =>
          o.setName("ban_id").setDescription("Ban ID (e.g. 12345)").setRequired(true)
        )
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("playerlookup")
        .setDescription("Look up a game player by identifier or name")
        .addStringOption((o) =>
          o
            .setName("identifier")
            .setDescription("steam:xxx / license:xxx / discord:xxx / player name")
            .setRequired(true)
        )
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("setup-verify")
        .setDescription("Post the verification embed with button in the verify channel")
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("setup-tickets")
        .setDescription("Post the support ticket panel in the ticket channel")
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("close-ticket")
        .setDescription("Close the current ticket, generate transcript, and DM the opener")
        .addStringOption((o) =>
          o.setName("reason").setDescription("Closing reason").setRequired(false)
        )
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("claim-ticket")
        .setDescription("Claim this ticket and assign it to yourself")
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("ticket-stats")
        .setDescription("Show ticket handling stats for support staff")
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("status")
        .setDescription("Check the status of your linked VexonAC server(s)")
    );

    this.commands.push(
      new SlashCommandBuilder()
        .setName("nuke")
        .setDescription("Purge messages from this channel (owner only)")
        .addIntegerOption((o) =>
          o
            .setName("amount")
            .setDescription("Number of messages to delete (1–100, default 100)")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(100)
        )
    );
  }

  private hasPermission(member: any, allowedRoleIds: string[]): boolean {
    // Owner always has permission
    if (member?.user?.id === discordBotConfig.ownerId) return true;

    if (!member || !("roles" in member)) return false;

    try {
      // Check if member.roles is a GuildMemberRoleManager (has cache property)
      if (
        typeof member.roles === "object" &&
        member.roles &&
        "cache" in member.roles
      ) {
        return allowedRoleIds.some((roleId) => member.roles.cache.has(roleId));
      }
      // Check if member.roles is a string array (API member)
      else if (Array.isArray(member.roles)) {
        return allowedRoleIds.some((roleId) => member.roles.includes(roleId));
      }
    } catch (error) {
      console.warn("Error checking permissions", {
        error,
        userId: member?.user?.id,
      });
    }

    return false;
  }

  private setupEventHandlers() {
    this.client.once("clientReady", async () => {
      console.info("Discord bot is ready!");

      await this.updateBotStatus();

      // Set up status update interval (every 10 minutes)
      this.statusUpdateInterval = setInterval(() => {
        this.updateBotStatus();
      }, 10 * 60 * 1000); // 10 minutes
    });

    this.client.on("guildMemberAdd", async (member) => {
      await this.handleMemberJoin(member);
    });

    this.client.on("messageCreate", async (message) => {
      await this.handleMessageCreate(message);
    });

    this.client.on("interactionCreate", async (interaction) => {
      // Button interactions
      if (interaction.isButton()) {
        if (interaction.customId === "vexonac_verify") {
          await this.handleVerifyButton(interaction as ButtonInteraction);
        } else if (interaction.customId === "open_ticket") {
          await this.handleOpenTicketButton(interaction as ButtonInteraction);
        } else if (interaction.customId === "close_ticket") {
          await this.handleCloseTicketButton(interaction as ButtonInteraction);
        }
        return;
      }

      // Select menu interactions
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "ticket_category") {
          await this.handleTicketCategorySelect(interaction as StringSelectMenuInteraction);
        }
        return;
      }

      if (!interaction.isCommand()) return;

      // Ensure we're in a guild context
      if (!interaction.guild || !interaction.member) {
        await this.safeReply(interaction as ChatInputCommandInteraction, {
          content: "This command can only be used in a server.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Check permissions
      const member = interaction.member;
      const commandName = interaction.commandName;

      // Define commands accessible by support role
      const supportCommands = ["unban", "resetip", "checkban"];
      const modCommands = ["warn", "warns", "clearwarns", "mute", "unmute", "raidmode"];
      const playerCommands = ["playerban", "playerunban", "playerlookup"];

      // Admin role always has access. Other roles have access to specific commands.
      const allowedRoles = [discordBotConfig.adminRoleId];
      if (supportCommands.includes(commandName)) {
        allowedRoles.push(discordBotConfig.operatorRoleId);
      }
      if (modCommands.includes(commandName)) {
        allowedRoles.push(discordBotConfig.operatorRoleId);
        if (discordBotConfig.modRoleId) allowedRoles.push(discordBotConfig.modRoleId);
      }
      if (playerCommands.includes(commandName)) {
        allowedRoles.push(discordBotConfig.operatorRoleId);
      }

      // Filter out empty role IDs to avoid false matches if config is missing
      const validAllowedRoles = allowedRoles.filter((id) => id && id.length > 0);

      if (!this.hasPermission(member, validAllowedRoles)) {
        await this.safeReply(interaction as ChatInputCommandInteraction, {
          content: "You do not have permission to use this command.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await this.handleCommand(interaction as ChatInputCommandInteraction);
    });
  }

  /**
   * Safely reply to an interaction with error handling for expired interactions
   */
  private async safeReply(interaction: Interaction, options: any) {
    try {
      if (!interaction.isRepliable()) return;

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(options);
      } else {
        await interaction.reply(options);
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        // Interaction has expired or is invalid, log but don't throw
        console.warn("Attempted to respond to an expired interaction", {
          interactionId: interaction.id,
        });
      } else {
        // For other errors, log them
        console.error("Error responding to interaction", { error });
      }
    }
  }

  private async updateBotStatus() {
    try {
      const latestVersion = await prisma.version.findFirst({
        orderBy: {
          updatedAt: "desc",
        },
      });

      if (latestVersion) {
        this.client.user?.setActivity({
          name: `v${latestVersion.version}`,
          type: ActivityType.Watching,
        });

        console.debug("Updated bot status with version", {
          version: latestVersion.version,
        });
      }
    } catch (error) {
      console.error("Failed to update bot status", { error });
    }
  }

  private async handleCommand(interaction: ChatInputCommandInteraction) {
    const commandName = interaction.commandName;

    switch (commandName) {
      case "ban":
        await this.handleBanCommand(interaction);
        break;
      case "unban":
        await this.handleUnbanCommand(interaction);
        break;
      case "checkban":
        await this.handleCheckBanCommand(interaction);
        break;
      case "resetip":
        await this.handleResetIpCommand(interaction);
        break;
      case "generate":
        await this.handleGenerateCommand(interaction);
        break;
      case "createversion":
        await this.handleCreateVersionCommand(interaction);
        break;
      case "creatediscount":
        await this.handleCreateDiscountCommand(interaction);
        break;
      case "deletediscount":
        await this.handleDeleteDiscountCommand(interaction);
        break;
      case "listdiscounts":
        await this.handleListDiscountsCommand(interaction);
        break;
      case "togglediscount":
        await this.handleToggleDiscountCommand(interaction);
        break;
      case "syncroles":
        await this.handleSyncRolesCommand(interaction);
        break;
      case "syncmembers":
        await this.handleSyncMembersCommand(interaction);
        break;
      case "warn":
        await this.handleWarnCommand(interaction);
        break;
      case "warns":
        await this.handleWarnsCommand(interaction);
        break;
      case "clearwarns":
        await this.handleClearWarnsCommand(interaction);
        break;
      case "mute":
        await this.handleMuteCommand(interaction);
        break;
      case "unmute":
        await this.handleUnmuteCommand(interaction);
        break;
      case "raidmode":
        await this.handleRaidModeCommand(interaction);
        break;
      case "playerban":
        await this.handlePlayerBanCommand(interaction);
        break;
      case "playerunban":
        await this.handlePlayerUnbanCommand(interaction);
        break;
      case "playerlookup":
        await this.handlePlayerLookupCommand(interaction);
        break;
      case "setup-verify":
        await this.handleSetupVerifyCommand(interaction);
        break;
      case "setup-tickets":
        await this.handleSetupTicketsCommand(interaction);
        break;
      case "close-ticket":
        await this.handleCloseTicketCommand(interaction);
        break;
      case "claim-ticket":
        await this.handleClaimTicketCommand(interaction);
        break;
      case "ticket-stats":
        await this.handleTicketStatsCommand(interaction);
        break;
      case "status":
        await this.handleStatusCommand(interaction);
        break;
      case "nuke":
        await this.handleNukeCommand(interaction);
        break;
      default:
        await this.safeReply(interaction, {
          content: "Unknown command",
          flags: MessageFlags.Ephemeral,
        });
    }
  }

  private async handleCreateVersionCommand(
    interaction: ChatInputCommandInteraction
  ) {
    try {
      await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
      });

      const version = interaction.options.getString("version", true);
      const changelog = interaction.options.getString("changelog");

      // Validate version format - basic validation for x.y.z format
      const versionRegex = /^\d+(\.\d+){0,2}$/;
      if (!versionRegex.test(version)) {
        await this.safeReply(interaction, {
          content: "Invalid version format. Please use a format like 1.2.3",
        });
        return;
      }

      try {
        // First check if version already exists
        const existingVersion = await prisma.version.findUnique({
          where: {
            version: version,
          },
        });

        if (existingVersion) {
          await this.safeReply(interaction, {
            content: `Version ${version} already exists in the database.`,
          });
          return;
        }

        // Insert the new version
        await prisma.version.create({
          data: {
            version: version,
            changelog: changelog || null,
          },
        });

        await this.safeReply(interaction, {
          content: `Version ${version} has been created successfully.`,
        });
        console.info("New version created via Discord", {
          version,
          createdBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error creating new version via Discord", {
          error,
          version,
        });
        await this.safeReply(interaction, {
          content: "Failed to create new version. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while creating version", {
          version: interaction.options.getString("version"),
        });
      } else {
        console.error("Unexpected error in handleCreateVersionCommand", {
          error,
        });
      }
    }
  }

  private async handleBanCommand(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const licenseKey = interaction.options.getString("license_key", true);
      const reason = interaction.options.getString("reason", true);

      try {
        // Check if license exists
        const license = await prisma.license.findUnique({
          where: {
            licenseKey: licenseKey,
          },
        });

        if (!license) {
          await this.safeReply(interaction, {
            content: "License key not found.",
          });
          return;
        }

        if (license.isBanned) {
          await this.safeReply(interaction, {
            content: "License is already banned.",
          });
          return;
        }

        // Ban the license
        await prisma.license.update({
          where: {
            licenseKey: licenseKey,
          },
          data: {
            isBanned: true,
            banReason: reason,
          },
        });

        await this.safeReply(interaction, {
          content: `License key \`${licenseKey}\` has been banned. Reason: ${reason}`,
        });
        console.info("License banned via Discord", {
          licenseKey,
          reason,
          bannedBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error banning license via Discord", {
          error,
          licenseKey,
        });
        await this.safeReply(interaction, {
          content: "Failed to ban license. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while banning license");
      } else {
        console.error("Unexpected error in handleBanCommand", { error });
      }
    }
  }

  private async handleUnbanCommand(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const licenseKey = interaction.options.getString("license_key", true);

      try {
        // Check if license exists
        const license = await prisma.license.findUnique({
          where: {
            licenseKey: licenseKey,
          },
        });

        if (!license) {
          await this.safeReply(interaction, {
            content: "License key not found.",
          });
          return;
        }

        if (!license.isBanned) {
          await this.safeReply(interaction, {
            content: "License is not banned.",
          });
          return;
        }

        // Unban the license
        await prisma.license.update({
          where: {
            licenseKey: licenseKey,
          },
          data: {
            isBanned: false,
            banReason: null,
          },
        });

        await this.safeReply(interaction, {
          content: `License key \`${licenseKey}\` has been unbanned.`,
        });
        console.info("License unbanned via Discord", {
          licenseKey,
          unbannedBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error unbanning license via Discord", {
          error,
          licenseKey,
        });
        await this.safeReply(interaction, {
          content: "Failed to unban license. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while unbanning license");
      } else {
        console.error("Unexpected error in handleUnbanCommand", { error });
      }
    }
  }

  private async handleCheckBanCommand(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const licenseKey = interaction.options.getString("license_key", true);

      try {
        // Check if license exists
        const license = await prisma.license.findUnique({
          where: {
            licenseKey: licenseKey,
          },
          select: {
            isBanned: true,
            banReason: true,
          },
        });

        if (!license) {
          await this.safeReply(interaction, {
            content: "License key not found.",
          });
          return;
        }

        if (license.isBanned) {
          await this.safeReply(interaction, {
            content: `License key \`${licenseKey}\` is **BANNED**.\n**Reason:** ${
              license.banReason || "No reason provided"
            }`,
          });
        } else {
          await this.safeReply(interaction, {
            content: `License key \`${licenseKey}\` is **NOT** banned.`,
          });
        }

        console.info("License ban status checked via Discord", {
          licenseKey,
          isBanned: license.isBanned,
          checkedBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error checking license ban status via Discord", {
          error,
          licenseKey,
        });
        await this.safeReply(interaction, {
          content: "Failed to check license status. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while checking license ban status");
      } else {
        console.error("Unexpected error in handleCheckBanCommand", { error });
      }
    }
  }

  private async handleResetIpCommand(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const licenseKey = interaction.options.getString("license_key", true);
      const reason = interaction.options.getString("reason") || "Manual IP reset via Discord";

      try {
        // Check if license exists
        const license = await prisma.license.findUnique({
          where: {
            licenseKey: licenseKey,
          },
          include: {
            serverInfo: {
              select: {
                lastActiveAt: true,
              },
            },
          },
        });

        if (!license) {
          await this.safeReply(interaction, {
            content: "License key not found.",
          });
          return;
        }

        if (license.isBanned) {
          await this.safeReply(interaction, {
            content: "Cannot reset IP for a banned license.",
          });
          return;
        }

        // Check if server was active in the last 30 days (for informational purposes)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const lastActiveAt = license.serverInfo?.lastActiveAt;
        const wasActiveLast30Days = lastActiveAt && lastActiveAt >= thirtyDaysAgo;

        // Reset the IP (manual override - bypasses activity check)
        await prisma.license.update({
          where: {
            licenseKey: licenseKey,
          },
          data: {
            serverIp: null,
          },
        });

        // Log the activity
        await prisma.serverLog.create({
          data: {
            licenseId: license.id,
            systemType: "IP_RESET",
            details: {
              reason: reason,
            },
          },
        });

        const activityStatus = wasActiveLast30Days ? "(server was active in last 30 days)" : "(server was inactive in last 30 days - manual override)";
        
        await this.safeReply(interaction, {
          content: `IP reset successfully for license key \`${licenseKey}\` ${activityStatus}.\nReason: ${reason}`,
        });
        
        console.info("License IP reset via Discord", {
          licenseKey,
          reason,
          wasActiveLast30Days,
          resetBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error resetting IP via Discord", {
          error,
          licenseKey,
        });
        await this.safeReply(interaction, {
          content: "Failed to reset IP. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while resetting IP");
      } else {
        console.error("Unexpected error in handleResetIpCommand", { error });
      }
    }
  }

  private async handleGenerateCommand(
    interaction: ChatInputCommandInteraction
  ) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const licenseType = interaction.options.getString(
        "type",
        true
      ) as LicenseType;
      const amount = interaction.options.getInteger("amount", true);

      try {
        const keys: string[] = [];

        // Generate and insert keys
        for (let i = 0; i < amount; i++) {
          // Generate a random license key
          const licenseKey = `vexonac-${licenseType.toLowerCase()}-${randomUUID()}`;

          // Insert into database
          await prisma.redemptionKey.create({
            data: {
              type: licenseType,
              licenseKey: licenseKey,
              generatedBy: interaction.user.tag,
            },
          });

          keys.push(licenseKey);
        }

        // Create a text file with one key per line
        const keysContent = keys.join("\n");
        const buffer = Buffer.from(keysContent, "utf-8");

        // Create attachment with the keys
        const attachment = new AttachmentBuilder(buffer, {
          name: `vexonac-${licenseType.toLowerCase()}-keys-${Date.now()}.txt`,
          description: `Generated ${amount} ${licenseType.toLowerCase()} license keys`,
        });

        await this.safeReply(interaction, {
          content: `Generated ${amount} ${licenseType.toLowerCase()} license key(s). Keys are attached in the file below:`,
          files: [attachment],
        });

        console.info("License keys generated via Discord", {
          amount,
          licenseType,
          generatedBy: interaction.user.id,
        });
      } catch (error) {
        console.error("Error generating license keys via Discord", {
          error,
          licenseType,
          amount,
        });
        await this.safeReply(interaction, {
          content: "Failed to generate license keys. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while generating license keys");
      } else {
        console.error("Unexpected error in handleGenerateCommand", { error });
      }
    }
  }

  private async handleCreateDiscountCommand(
    interaction: ChatInputCommandInteraction
  ) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const code = interaction.options.getString("code", true).toUpperCase().trim();
      const type = interaction.options.getString("type", true) as "PERCENTAGE" | "FIXED_AMOUNT";
      const value = interaction.options.getInteger("value", true);
      const description = interaction.options.getString("description");
      const autoApply = interaction.options.getBoolean("auto_apply") ?? false;
      const expiresInDays = interaction.options.getInteger("expires_in_days");

      try {
        // Validate code format
        const codeRegex = /^[A-Z0-9]{3,20}$/;
        if (!codeRegex.test(code)) {
          await this.safeReply(interaction, {
            content: "Invalid discount code format. Use 3-20 alphanumeric characters only.",
          });
          return;
        }

        // Check if code already exists
        const existingDiscount = await prisma.discount.findUnique({
          where: { code },
        });

        if (existingDiscount) {
          await this.safeReply(interaction, {
            content: `Discount code \`${code}\` already exists.`,
          });
          return;
        }

        // Validate value based on type
        if (type === "PERCENTAGE" && (value < 1 || value > 100)) {
          await this.safeReply(interaction, {
            content: "Percentage discount must be between 1 and 100.",
          });
          return;
        }

        // Calculate expiration date
        let expiresAt: Date | null = null;
        if (expiresInDays) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        // Create discount
        const discount = await prisma.discount.create({
          data: {
            code,
            discountType: type === "PERCENTAGE" ? DiscountType.PERCENTAGE : DiscountType.FIXED_AMOUNT,
            discountAmount: type === "FIXED_AMOUNT" ? value : 0,
            discountPercentage: type === "PERCENTAGE" ? value : 0,
            description: description || null,
            autoApply: autoApply,
            expiresAt,
            isActive: true,
          },
        });

        const typeStr = type === "PERCENTAGE" ? `${value}%` : `â‚¬${value}`;
        const expiryStr = expiresAt ? `\nExpires: ${expiresAt.toISOString().split('T')[0]}` : "\nNo expiration";
        const autoApplyStr = autoApply ? "\nâœ¨ **Auto-applied** (shown automatically to users)" : "";

        await this.safeReply(interaction, {
          content: `âœ… Discount code created successfully!\n\n**Code:** \`${code}\`\n**Type:** ${typeStr}\n**Description:** ${description || "None"}${expiryStr}${autoApplyStr}`,
        });

        console.info("Discount created via Discord", {
          code,
          type,
          value,
          autoApply,
          createdBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error creating discount via Discord", { error, code });
        await this.safeReply(interaction, {
          content: "Failed to create discount. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while creating discount");
      } else {
        console.error("Unexpected error in handleCreateDiscountCommand", { error });
      }
    }
  }

  private async handleDeleteDiscountCommand(
    interaction: ChatInputCommandInteraction
  ) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const code = interaction.options.getString("code", true).toUpperCase().trim();

      try {
        // Check if discount exists
        const discount = await prisma.discount.findUnique({
          where: { code },
        });

        if (!discount) {
          await this.safeReply(interaction, {
            content: `Discount code \`${code}\` not found.`,
          });
          return;
        }

        // Delete the discount
        await prisma.discount.delete({
          where: { code },
        });

        await this.safeReply(interaction, {
          content: `âœ… Discount code \`${code}\` has been deleted successfully.`,
        });

        console.info("Discount deleted via Discord", {
          code,
          deletedBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error deleting discount via Discord", { error, code });
        await this.safeReply(interaction, {
          content: "Failed to delete discount. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while deleting discount");
      } else {
        console.error("Unexpected error in handleDeleteDiscountCommand", { error });
      }
    }
  }

  private async handleListDiscountsCommand(
    interaction: ChatInputCommandInteraction
  ) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const includeExpired = interaction.options.getBoolean("include_expired") ?? false;

      try {
        const now = new Date();
        
        // Build where clause
        const whereClause: any = {};
        if (!includeExpired) {
          whereClause.OR = [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ];
        }

        const discounts = await prisma.discount.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
        });

        if (discounts.length === 0) {
          await this.safeReply(interaction, {
            content: includeExpired 
              ? "No discounts found." 
              : "No active discounts found. Use `include_expired: true` to see expired discounts.",
          });
          return;
        }

        // Format discounts into a readable list
        let message = `**Discount Codes (${discounts.length}):**\n\n`;
        
        for (const discount of discounts) {
          const isExpired = discount.expiresAt && discount.expiresAt < now;
          const isActive = discount.isActive && !isExpired;
          
          const statusEmoji = isActive ? "âœ…" : isExpired ? "â°" : "âŒ";
          const typeValue = discount.discountType === DiscountType.PERCENTAGE 
            ? `${discount.discountPercentage}%` 
            : `â‚¬${discount.discountAmount}`;
          const autoApplyBadge = discount.autoApply ? " âœ¨" : "";
          const expiryStr = discount.expiresAt 
            ? ` | Expires: ${discount.expiresAt.toISOString().split('T')[0]}` 
            : "";
          
          message += `${statusEmoji} \`${discount.code}\`${autoApplyBadge} - ${typeValue}${expiryStr}\n`;
          if (discount.description) {
            message += `   â”” ${discount.description}\n`;
          }
        }

        message += `\n**Legend:**\nâœ… Active | âŒ Disabled | â° Expired | âœ¨ Auto-applied`;

        await this.safeReply(interaction, {
          content: message,
        });

        console.info("Discounts listed via Discord", {
          count: discounts.length,
          includeExpired,
          requestedBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error listing discounts via Discord", { error });
        await this.safeReply(interaction, {
          content: "Failed to list discounts. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while listing discounts");
      } else {
        console.error("Unexpected error in handleListDiscountsCommand", { error });
      }
    }
  }

  private async handleToggleDiscountCommand(
    interaction: ChatInputCommandInteraction
  ) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const code = interaction.options.getString("code", true).toUpperCase().trim();

      try {
        // Check if discount exists
        const discount = await prisma.discount.findUnique({
          where: { code },
        });

        if (!discount) {
          await this.safeReply(interaction, {
            content: `Discount code \`${code}\` not found.`,
          });
          return;
        }

        // Toggle the active status
        const updatedDiscount = await prisma.discount.update({
          where: { code },
          data: { isActive: !discount.isActive },
        });

        const statusText = updatedDiscount.isActive ? "enabled âœ…" : "disabled âŒ";

        await this.safeReply(interaction, {
          content: `Discount code \`${code}\` has been ${statusText}.`,
        });

        console.info("Discount toggled via Discord", {
          code,
          newStatus: updatedDiscount.isActive,
          toggledBy: interaction.user.tag,
        });
      } catch (error) {
        console.error("Error toggling discount via Discord", { error, code });
        await this.safeReply(interaction, {
          content: "Failed to toggle discount. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while toggling discount");
      } else {
        console.error("Unexpected error in handleToggleDiscountCommand", { error });
      }
    }
  }

  private async handleSyncRolesCommand(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        // Fetch all distinct discord IDs from non-banned licenses
        const licenses = await prisma.license.findMany({
          where: {
            isBanned: false,
            discordId: {
              not: "", // Ensure not empty
            },
          },
          select: {
            discordId: true,
          },
          distinct: ["discordId"],
        });

        const totalUsers = licenses.length;

        if (totalUsers === 0) {
          await this.safeReply(interaction, {
            content: "No valid license holders found.",
          });
          return;
        }

        // Calculate estimated time (200ms per user)
        const estimatedMinutes = Math.ceil((totalUsers * 250) / 1000 / 60);

        await this.safeReply(interaction, {
          content: `Found **${totalUsers}** unique valid license holders.\nStarting role sync process...\n\nâ±ï¸ Estimated time: ~${estimatedMinutes} minutes.\n\nThis process will run in the background. Check server logs for detailed progress.`,
        });

        console.info("Starting role sync via Discord command", {
          totalUsers,
          requestedBy: interaction.user.tag,
        });

        // Run in background
        this.processRoleSync(licenses.map((l) => l.discordId), interaction).catch(
          (err) => console.error("Background role sync failed", err)
        );
      } catch (error) {
        console.error("Error initiating role sync via Discord", { error });
        await this.safeReply(interaction, {
          content: "Failed to start role sync. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while syncing roles");
      } else {
        console.error("Unexpected error in handleSyncRolesCommand", { error });
      }
    }
  }

  private async processRoleSync(
    discordIds: string[],
    interaction: ChatInputCommandInteraction
  ) {
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    console.info(`Starting background role sync for ${discordIds.length} users...`);

    const startTime = Date.now();

    for (let i = 0; i < discordIds.length; i++) {
      const userId = discordIds[i];

      try {
        // Rate limiting: 250ms delay (reduced from original plan to be safer)
        // This is a conservative limit to avoid hitting Discord API limits
        await new Promise((resolve) => setTimeout(resolve, 250));

        const result = await discordUserService.addCustomerRole(userId);

        if (result.success) {
          successCount++;
        } else {
          // If user is not in server (404)
          if (result.status === 404) {
            skippedCount++;
          } else {
            failCount++;
          }
        }

        // Log progress every 50 users
        if ((i + 1) % 50 === 0) {
          console.info(
            `Role sync progress: ${i + 1}/${discordIds.length} (Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${failCount})`
          );
        }
      } catch (err) {
        console.error(`Error processing user ${userId} during sync`, err);
        failCount++;
      }
    }

    const durationSeconds = (Date.now() - startTime) / 1000;
    console.info(
      `Role sync completed in ${durationSeconds.toFixed(1)}s. Total: ${
        discordIds.length
      }, Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${failCount}`
    );

    // Try to update the interaction if it's still valid
    try {
      await interaction.editReply({
        content: `âœ… **Role Sync Completed**\n\n**Total Scanned:** ${discordIds.length}\n**Success:** ${successCount}\n**Skipped (not in server):** ${skippedCount}\n**Failed:** ${failCount}\n\nâ±ï¸ Time taken: ${durationSeconds.toFixed(1)}s`,
      });
    } catch (e) {
      // Interaction likely expired if the job took too long, which is expected
      console.debug("Could not update interaction with final stats (likely expired)");
    }
  }

  private async handleSyncMembersCommand(
    interaction: ChatInputCommandInteraction
  ) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        // Fetch all accounts with Discord provider and access token
        const accounts = await prisma.account.findMany({
          where: {
            providerId: "discord",
            accessToken: {
              not: null,
            },
            accountId: {
              not: "", // Ensure not empty
            },
          },
          select: {
            accountId: true, // This is the Discord User ID
          },
          distinct: ["accountId"],
        });

        const totalUsers = accounts.length;

        if (totalUsers === 0) {
          await this.safeReply(interaction, {
            content: "No users with linked Discord accounts found.",
          });
          return;
        }

        // Calculate estimated time (250ms per user)
        const estimatedMinutes = Math.ceil((totalUsers * 250) / 1000 / 60);

        await this.safeReply(interaction, {
          content: `Found **${totalUsers}** users with linked Discord accounts.\nStarting member join sync process...\n\nâ±ï¸ Estimated time: ~${estimatedMinutes} minutes.\n\nThis process will run in the background. Check server logs for detailed progress.`,
        });

        console.info("Starting member join sync via Discord command", {
          totalUsers,
          requestedBy: interaction.user.tag,
        });

        // Run in background
        this.processMemberSync(
          accounts.map((a) => a.accountId),
          interaction
        ).catch((err) =>
          console.error("Background member sync failed", err)
        );
      } catch (error) {
        console.error("Error initiating member sync via Discord", { error });
        await this.safeReply(interaction, {
          content: "Failed to start member sync. Check logs for details.",
        });
      }
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10062) {
        console.warn("Interaction expired while syncing members");
      } else {
        console.error("Unexpected error in handleSyncMembersCommand", {
          error,
        });
      }
    }
  }

  private async processMemberSync(
    discordIds: string[],
    interaction: ChatInputCommandInteraction
  ) {
    let successCount = 0;
    let alreadyMemberCount = 0;
    let failCount = 0;
    let invalidTokenCount = 0;

    console.info(
      `Starting background member sync for ${discordIds.length} users...`
    );

    const startTime = Date.now();

    for (let i = 0; i < discordIds.length; i++) {
      const userId = discordIds[i];

      try {
        // Rate limiting: 250ms delay
        await new Promise((resolve) => setTimeout(resolve, 250));

        const result = await discordUserService.joinUserToGuild(userId);

        if (result.success) {
          if (result.alreadyMember) {
            alreadyMemberCount++;
          } else {
            successCount++;
          }
        } else {
          // Handle different failure scenarios
          if (result.status === 401 || result.status === 403) {
            // Likely invalid token or revoked access
            invalidTokenCount++;
          } else {
            failCount++;
          }
        }

        // Log progress every 50 users
        if ((i + 1) % 50 === 0) {
          console.info(
            `Member sync progress: ${i + 1}/${
              discordIds.length
            } (Joined: ${successCount}, Already Member: ${alreadyMemberCount}, Invalid Token: ${invalidTokenCount}, Other Fail: ${failCount})`
          );
        }
      } catch (err) {
        console.error(`Error processing user ${userId} during member sync`, err);
        failCount++;
      }
    }

    const durationSeconds = (Date.now() - startTime) / 1000;
    console.info(
      `Member sync completed in ${durationSeconds.toFixed(1)}s. Total: ${
        discordIds.length
      }, Joined: ${successCount}, Already Member: ${alreadyMemberCount}, Invalid Token: ${invalidTokenCount}, Other Fail: ${failCount}`
    );

    // Try to update the interaction if it's still valid
    try {
      await interaction.editReply({
        content: `âœ… **Member Join Sync Completed**\n\n**Total Scanned:** ${
          discordIds.length
        }\n**Joined:** ${successCount}\n**Already In Server:** ${alreadyMemberCount}\n**Invalid/Expired Tokens:** ${invalidTokenCount}\n**Other Errors:** ${failCount}\n\nâ±ï¸ Time taken: ${durationSeconds.toFixed(
          1
        )}s`,
      });
    } catch (e) {
      console.debug(
        "Could not update interaction with final stats (likely expired)"
      );
    }
  }

  // ── Moderation helpers ────────────────────────────────────────

  private async sendModLog(guild: Guild, description: string, color = 0x5865f2): Promise<void> {
    const channelId = discordBotConfig.logChannelId;
    if (!channelId) return;
    try {
      const ch = guild.channels.cache.get(channelId) as TextChannel | undefined;
      if (!ch?.isTextBased()) return;
      await ch.send({
        embeds: [{ color, description, timestamp: new Date().toISOString(), footer: { text: "VexonAC AutoMod" } }],
      });
    } catch {}
  }

  private async addWarn(guild: Guild, member: GuildMember, reason: string): Promise<void> {
    const userId = member.user.id;
    const warns = this.warns.get(userId) ?? [];
    warns.push(reason);
    this.warns.set(userId, warns);
    const count = warns.length;

    await this.sendModLog(
      guild,
      `⚠️ **${member.user.tag}** warned — ${reason}\nTotal warnings: **${count}/7**`,
      0xfee75c,
    );

    try {
      await member.user.send(
        `⚠️ You have been warned in **${guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${count}/7`,
      );
    } catch {}

    if (count >= 7) {
      try {
        await member.ban({ reason: `AutoMod: ${count} warnings` });
        await this.sendModLog(guild, `🔨 **${member.user.tag}** banned (${count} warnings)`, 0xed4245);
      } catch {}
    } else if (count >= 5) {
      try {
        await member.kick(`AutoMod: ${count} warnings`);
        await this.sendModLog(guild, `👢 **${member.user.tag}** kicked (${count} warnings)`, 0xff6b6b);
      } catch {}
    } else if (count >= 3) {
      try {
        await member.timeout(60 * 60 * 1000, `AutoMod: ${count} warnings`);
        await this.sendModLog(guild, `🔇 **${member.user.tag}** muted 1 hour (${count} warnings)`, 0xffa500);
      } catch {}
    }
  }

  // ── Join / auto-role / welcome ────────────────────────────────

  private async handleMemberJoin(member: GuildMember): Promise<void> {
    const now = Date.now();

    // Raid detection: 5+ joins in 10 seconds
    this.recentJoins = this.recentJoins.filter((t) => now - t < 10_000);
    this.recentJoins.push(now);
    if (this.recentJoins.length >= 5 && !this.raidMode) {
      this.raidMode = true;
      await this.sendModLog(
        member.guild,
        `🚨 **RAID DETECTED** — ${this.recentJoins.length} joins in 10 s. Raid mode enabled. Auto-roles paused.\nRun \`/raidmode off\` when clear.`,
        0xff0000,
      );
    }

    // Auto-role (skip during raid mode)
    const autoRoleId = discordBotConfig.autoRoleId;
    if (autoRoleId && !this.raidMode) {
      try {
        await member.roles.add(autoRoleId);
      } catch (e) {
        console.warn("[Bot] Failed to add auto-role:", e);
      }
    }

    // Welcome message
    const welcomeChannelId = discordBotConfig.welcomeChannelId;
    if (welcomeChannelId) {
      try {
        const ch = member.guild.channels.cache.get(welcomeChannelId) as TextChannel | undefined;
        if (ch?.isTextBased()) {
          await ch.send({
            embeds: [
              {
                color: 0x57f287,
                title: `Welcome to ${member.guild.name}!`,
                description:
                  `Hey ${member}, welcome to the **VexonAC** community!\n\n` +
                  `🛡️ VexonAC is a premium FiveM anti-cheat solution.\n` +
                  `📖 Browse the channels to get started.\n` +
                  `🔑 Already have a license? Link your Discord in the panel at **vexonac.com**.`,
                thumbnail: { url: member.user.displayAvatarURL({ size: 256 }) },
                footer: { text: `Member #${member.guild.memberCount}` },
                timestamp: new Date().toISOString(),
              },
            ],
          });
        }
      } catch {}
    }
  }

  // ── AutoMod: anti-spam / anti-link / blacklist ────────────────

  private async handleMessageCreate(message: Message): Promise<void> {
    if (message.author.bot || !message.guild || !message.member) return;
    if (!message.channel.isTextBased() || !("send" in message.channel)) return;
    const channel = message.channel as TextChannel;

    const member = message.member;
    const bypassRoles = [
      discordBotConfig.adminRoleId,
      discordBotConfig.operatorRoleId,
      discordBotConfig.modRoleId,
    ].filter(Boolean);
    if (bypassRoles.some((id) => member.roles.cache.has(id))) return;

    const content = message.content.toLowerCase();

    // 1. Blacklisted words
    const hit = discordBotConfig.blacklistWords.find((w) => content.includes(w));
    if (hit) {
      await message.delete().catch(() => {});
      const notice = await channel
        .send({ content: `${message.author}, your message was removed for containing a prohibited word.` })
        .catch(() => null);
      if (notice) setTimeout(() => notice.delete().catch(() => {}), 5000);
      await this.addWarn(message.guild, member, `Blacklisted word`);
      return;
    }

    // 2. Invite links (always blocked)
    const inviteRegex = /discord\.gg\/\S+|discord\.com\/invite\/\S+/i;
    if (inviteRegex.test(message.content)) {
      await message.delete().catch(() => {});
      const notice = await channel
        .send({ content: `${message.author}, invite links are not allowed.` })
        .catch(() => null);
      if (notice) setTimeout(() => notice.delete().catch(() => {}), 5000);
      await this.addWarn(message.guild, member, "Posted a Discord invite link");
      return;
    }

    // 3. External URLs (allow CDN & vexonac.com)
    const urlRegex = /https?:\/\/\S+/i;
    const safeHostPatterns = [
      "vexonac.com",
      "cdn.discordapp.com",
      "media.discordapp.net",
      "tenor.com",
      "giphy.com",
      "imgur.com",
      "youtube.com",
      "youtu.be",
    ];
    if (urlRegex.test(message.content)) {
      const urls = message.content.match(/https?:\/\/\S+/gi) ?? [];
      const hasBlocked = urls.some((u) => !safeHostPatterns.some((h) => u.includes(h)));
      if (hasBlocked) {
        await message.delete().catch(() => {});
        const notice = await channel
          .send({ content: `${message.author}, external links are not permitted here.` })
          .catch(() => null);
        if (notice) setTimeout(() => notice.delete().catch(() => {}), 5000);
        await this.addWarn(message.guild, member, "Posted an external URL");
        return;
      }
    }

    // 4. Anti-spam: ≥5 messages in 3 seconds
    const now = Date.now();
    const userId = message.author.id;
    const sp = this.spamTracker.get(userId) ?? { count: 0, resetAt: now + 3000 };
    if (now > sp.resetAt) {
      sp.count = 1;
      sp.resetAt = now + 3000;
    } else {
      sp.count++;
    }
    this.spamTracker.set(userId, sp);

    if (sp.count >= 5) {
      sp.count = 0;
      try {
        const fetched = await message.channel.messages.fetch({ limit: 10 });
        for (const [, m] of fetched) {
          if (m.author.id === userId && now - m.createdTimestamp < 5000) {
            await m.delete().catch(() => {});
          }
        }
        await this.addWarn(message.guild, member, "Spamming messages");
      } catch {}
    }
  }

  // ── Moderation commands ───────────────────────────────────────

  private async handleWarnCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    if (!interaction.guild) { await this.safeReply(interaction, { content: "Guild not found." }); return; }
    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) { await this.safeReply(interaction, { content: "Member not found in this server." }); return; }
      await this.addWarn(interaction.guild, member, reason);
      const count = this.warns.get(target.id)?.length ?? 0;
      await this.safeReply(interaction, {
        content: `⚠️ **${target.tag}** has been warned.\n**Reason:** ${reason}\n**Total warnings:** ${count}/7`,
      });
    } catch {
      await this.safeReply(interaction, { content: "Failed to warn member." });
    }
  }

  private async handleWarnsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user", true);
    const warns = this.warns.get(target.id) ?? [];
    if (warns.length === 0) {
      await this.safeReply(interaction, { content: `✅ **${target.tag}** has no warnings.` });
      return;
    }
    await this.safeReply(interaction, {
      content: `⚠️ **${target.tag}** has **${warns.length}** warning(s):\n${warns.map((r, i) => `**${i + 1}.** ${r}`).join("\n")}`,
    });
  }

  private async handleClearWarnsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user", true);
    this.warns.delete(target.id);
    await this.safeReply(interaction, { content: `✅ Cleared all warnings for **${target.tag}**.` });
  }

  private async handleMuteCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target  = interaction.options.getUser("user", true);
    const minutes = interaction.options.getInteger("minutes", true);
    const reason  = interaction.options.getString("reason") ?? "No reason provided";
    if (!interaction.guild) { await this.safeReply(interaction, { content: "Guild not found." }); return; }
    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) { await this.safeReply(interaction, { content: "Member not found." }); return; }
      await member.timeout(minutes * 60 * 1000, reason);
      await this.safeReply(interaction, {
        content: `🔇 **${target.tag}** muted for **${minutes} min**.\n**Reason:** ${reason}`,
      });
      await this.sendModLog(
        interaction.guild,
        `🔇 **${target.tag}** muted **${minutes} min** by ${interaction.user.tag}\n**Reason:** ${reason}`,
        0xffa500,
      );
    } catch {
      await this.safeReply(interaction, { content: "Failed to mute member. Check bot permissions." });
    }
  }

  private async handleUnmuteCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user", true);
    if (!interaction.guild) { await this.safeReply(interaction, { content: "Guild not found." }); return; }
    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) { await this.safeReply(interaction, { content: "Member not found." }); return; }
      await member.timeout(null);
      await this.safeReply(interaction, { content: `✅ **${target.tag}** has been unmuted.` });
      await this.sendModLog(interaction.guild, `🔊 **${target.tag}** unmuted by ${interaction.user.tag}`, 0x57f287);
    } catch {
      await this.safeReply(interaction, { content: "Failed to unmute member." });
    }
  }

  private async handleRaidModeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const state = interaction.options.getString("state", true);
    this.raidMode = state === "on";
    if (this.raidMode === false) this.recentJoins = [];
    await this.safeReply(interaction, {
      content: this.raidMode ? "🚨 Raid mode **enabled**. Auto-roles paused." : "✅ Raid mode **disabled**. Auto-roles resumed.",
    });
    if (interaction.guild) {
      await this.sendModLog(
        interaction.guild,
        `${this.raidMode ? "🚨 Raid mode enabled" : "✅ Raid mode disabled"} by ${interaction.user.tag}`,
        this.raidMode ? 0xff0000 : 0x57f287,
      );
    }
  }

  // ── Player commands ───────────────────────────────────────────

  private async handlePlayerBanCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const identifier = interaction.options.getString("identifier", true).trim();
    const reason     = interaction.options.getString("reason", true);

    const validPrefixes = ["steam:", "license:", "discord:", "fivem:", "fid:", "xbox:", "live:"];
    if (!validPrefixes.some((p) => identifier.startsWith(p))) {
      await this.safeReply(interaction, {
        content: `Invalid identifier. Must start with: ${validPrefixes.join(", ")}`,
      });
      return;
    }

    try {
      const players = await prisma.player.findMany({
        where: {
          OR: [
            { playerLicense: identifier },
            { identifiers: { array_contains: [identifier] } as any },
            { oldIdentifiers: { array_contains: [identifier] } as any },
          ],
        },
        select: {
          id: true,
          playerName: true,
          playerLicense: true,
          identifiers: true,
          licenseId: true,
          license: { select: { id: true, serverName: true } },
        },
      });

      if (players.length === 0) {
        await this.safeReply(interaction, {
          content: `No player found with identifier \`${identifier}\`.`,
        });
        return;
      }

      let bannedCount = 0;
      const bannedServers: string[] = [];

      for (const player of players) {
        try {
          let banId = "";
          let attempts = 0;
          do {
            banId = (Math.floor(Math.random() * 90000) + 10000).toString();
            const existing = await prisma.ban.findUnique({
              where: { licenseId_banId: { licenseId: player.licenseId, banId } },
            });
            if (!existing) break;
          } while (++attempts < 100);

          const ban = await prisma.ban.create({
            data: {
              playerId: player.id,
              licenseId: player.licenseId,
              banId,
              reason,
              details: {},
              bannedBy: `Discord: ${interaction.user.tag}`,
              bannedAt: new Date(),
            },
          });

          await prisma.banHistory.create({
            data: { playerId: player.id, licenseId: player.licenseId, reason, details: {} },
          });

          const ids = Array.isArray(player.identifiers) ? (player.identifiers as string[]) : [player.playerLicense];
          await prisma.bannedIdentifier.createMany({
            data: ids.map((id: string) => ({ banId: ban.id, type: parseIdentifierType(id), value: id })),
            skipDuplicates: true,
          });

          bannedCount++;
          bannedServers.push(player.license.serverName ?? "Unknown");
        } catch (err) {
          console.error(`[Bot] playerban failed for server ${player.license.serverName}:`, err);
        }
      }

      if (bannedCount === 0) {
        await this.safeReply(interaction, { content: "Failed to create any ban records. Check logs." });
        return;
      }

      const playerName = players[0]?.playerName ?? identifier;
      await this.safeReply(interaction, {
        content: `🔨 **${playerName}** banned on **${bannedCount}** server(s).\n**Reason:** ${reason}\n**Servers:** ${bannedServers.join(", ")}`,
      });
      if (interaction.guild) {
        await this.sendModLog(
          interaction.guild,
          `🔨 **Player Ban** via Discord\n**Player:** ${playerName}\n**Identifier:** \`${identifier}\`\n**Reason:** ${reason}\n**Banned on:** ${bannedServers.join(", ")}\n**By:** ${interaction.user.tag}`,
          0xed4245,
        );
      }
    } catch (err) {
      console.error("[Bot] playerban error:", err);
      await this.safeReply(interaction, { content: "Failed to ban player. Check logs for details." });
    }
  }

  private async handlePlayerUnbanCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const banIdStr = interaction.options.getString("ban_id", true).trim();

    try {
      const ban = await prisma.ban.findFirst({
        where: { banId: banIdStr },
        include: {
          player: { select: { playerName: true } },
          license: { select: { serverName: true } },
        },
      });

      if (!ban) {
        await this.safeReply(interaction, { content: `No ban found with ID \`#${banIdStr}\`.` });
        return;
      }

      await prisma.bannedIdentifier.deleteMany({ where: { banId: ban.id } });
      await prisma.ban.delete({ where: { id: ban.id } });

      await this.safeReply(interaction, {
        content: `✅ Ban **#${banIdStr}** for **${ban.player.playerName}** (${ban.license.serverName}) has been removed.`,
      });
      if (interaction.guild) {
        await this.sendModLog(
          interaction.guild,
          `✅ **Player Unban**\n**Player:** ${ban.player.playerName}\n**Ban ID:** #${banIdStr}\n**Server:** ${ban.license.serverName}\n**By:** ${interaction.user.tag}`,
          0x57f287,
        );
      }
    } catch (err) {
      console.error("[Bot] playerunban error:", err);
      await this.safeReply(interaction, { content: "Failed to remove ban. Check logs for details." });
    }
  }

  private async handlePlayerLookupCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const query = interaction.options.getString("identifier", true).trim();

    try {
      const players = await prisma.player.findMany({
        where: {
          OR: [
            { playerLicense: query },
            { playerName: { contains: query, mode: "insensitive" } },
            { identifiers: { array_contains: [query] } as any },
            { oldIdentifiers: { array_contains: [query] } as any },
          ],
        },
        select: {
          playerName: true,
          playerLicense: true,
          identifiers: true,
          playTime: true,
          lastJoin: true,
          license: { select: { serverName: true } },
          bans: {
            select: { banId: true, reason: true, bannedAt: true, expiresAt: true },
            orderBy: { bannedAt: "desc" },
            take: 3,
          },
        },
        take: 5,
      });

      if (players.length === 0) {
        await this.safeReply(interaction, { content: `No player found matching \`${query}\`.` });
        return;
      }

      const now = new Date();
      const lines: string[] = [];
      for (const p of players) {
        const ids = (p.identifiers as string[]) ?? [];
        const steam  = ids.find((i) => i.startsWith("steam:"))?.replace("steam:", "");
        const active = p.bans.filter((b) => !b.expiresAt || b.expiresAt > now).length;
        lines.push(
          `**${p.playerName}** — ${p.license.serverName ?? "Unknown"}`,
          `└ License: \`${p.playerLicense}\`` + (steam ? ` | Steam: \`${steam}\`` : ""),
          `└ Playtime: ${Math.floor((p.playTime ?? 0) / 60)}h | Bans: ${active} active (${p.bans.length} total)`,
          `└ Last seen: ${p.lastJoin ? `<t:${Math.floor(new Date(p.lastJoin).getTime() / 1000)}:R>` : "Never"}`,
          "",
        );
      }

      await this.safeReply(interaction, {
        embeds: [
          {
            color: 0x5865f2,
            title: `Player Lookup: ${query}`,
            description: lines.join("\n").slice(0, 4096),
            footer: { text: `${players.length} result(s)` },
          },
        ],
      });
    } catch (err) {
      console.error("[Bot] playerlookup error:", err);
      await this.safeReply(interaction, { content: "Failed to look up player." });
    }
  }

  // ── Customer onboarding DM ────────────────────────────────────

  async sendOnboardingDM(discordId: string, serverName: string, serverId: string, expiresAt: Date | null): Promise<void> {
    try {
      const user = await this.client.users.fetch(discordId).catch(() => null);
      if (!user) return;

      const ingressUrl = process.env.INGRESS_API_URL ?? "https://ingress.vexonac.com";
      const expiryText = expiresAt
        ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:D>`
        : "Lifetime";

      await user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("🎉 Welcome to VexonAC!")
            .setDescription(
              `Your license for **${serverName}** has been activated!\n\n` +
              `Here's everything you need to get set up:\n\n` +
              `**Step 1 — Download the resource**\n` +
              `Go to your dashboard and download **VexonAC.zip**, then extract it into your FiveM \`resources/\` folder.\n\n` +
              `**Step 2 — Add to server.cfg**\n` +
              `\`\`\`\nset vexonac_ingress_url "${ingressUrl}"\nset vexonac_ingress_key "YOUR_KEY_FROM_DASHBOARD"\nensure VexonAC\`\`\`\n\n` +
              `**Step 3 — Start your server**\n` +
              `Restart FiveM and your server should appear Online in the dashboard.\n\n` +
              `📖 Full docs: https://docs.vexonac.com\n` +
              `🖥️ Dashboard: https://vexonac.com/dashboard`,
            )
            .addFields(
              { name: "Server", value: serverName, inline: true },
              { name: "License expires", value: expiryText, inline: true },
            )
            .setFooter({ text: "VexonAC — Premium FiveM Anti-Cheat" })
            .setTimestamp(),
        ],
      });
    } catch (err) {
      console.error("[Bot] onboarding DM error:", err);
    }
  }

  // ── /status command ───────────────────────────────────────────

  private async handleStatusCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const discordId = interaction.user.id;

    try {
      const licenses = await prisma.license.findMany({
        where: { discordId },
        include: { serverInfo: true },
        take: 5,
      });

      if (licenses.length === 0) {
        await this.safeReply(interaction, {
          content: "❌ No VexonAC servers linked to your Discord account. Visit **vexonac.com** to get started.",
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("📡 Your VexonAC Server Status")
        .setFooter({ text: "VexonAC — Status updated" })
        .setTimestamp();

      for (const lic of licenses) {
        const info = lic.serverInfo;
        const online = info?.isOnline ?? false;
        const players = info?.playerCount ?? 0;
        const max = info?.maxSlots ?? "?";
        const version = info?.version ?? "unknown";
        const expiresAt = lic.expiresAt
          ? `<t:${Math.floor(new Date(lic.expiresAt).getTime() / 1000)}:R>`
          : "Lifetime";
        const lastSeen = info?.lastActiveAt
          ? `<t:${Math.floor(new Date(info.lastActiveAt).getTime() / 1000)}:R>`
          : "Never";

        embed.addFields({
          name: `${online ? "🟢" : "🔴"} ${lic.serverName}`,
          value: [
            `**Status:** ${online ? "Online" : "Offline"}`,
            `**Players:** ${online ? `${players} / ${max}` : "—"}`,
            `**Version:** ${version}`,
            `**Last seen:** ${lastSeen}`,
            `**Expires:** ${expiresAt}`,
          ].join("\n"),
          inline: licenses.length > 1,
        });
      }

      await this.safeReply(interaction, { embeds: [embed] });
    } catch (err) {
      console.error("[Bot] /status error:", err);
      await this.safeReply(interaction, { content: "❌ Failed to fetch server status." });
    }
  }

  // ── /claim-ticket & /ticket-stats ─────────────────────────────

  private async handleClaimTicketCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const ticket = this.openTickets.get(interaction.channelId);
    if (!ticket) {
      await this.safeReply(interaction, { content: "❌ This is not an open ticket channel.", flags: MessageFlags.Ephemeral });
      return;
    }

    const member = interaction.member as GuildMember;
    const isSupportOrAdmin =
      (discordBotConfig.supportRoleId && member.roles.cache.has(discordBotConfig.supportRoleId)) ||
      (discordBotConfig.adminRoleId && member.roles.cache.has(discordBotConfig.adminRoleId)) ||
      member.user.id === discordBotConfig.ownerId;

    if (!isSupportOrAdmin) {
      await this.safeReply(interaction, { content: "❌ Only support staff can claim tickets.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (ticket.claimedBy) {
      await this.safeReply(interaction, {
        content: `❌ This ticket is already claimed by **${ticket.claimedByTag}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    ticket.claimedBy = interaction.user.id;
    ticket.claimedByTag = interaction.user.tag;

    // Track staff stats
    const stats = this.staffStats.get(interaction.user.id) ?? { claimed: 0, closed: 0, tag: interaction.user.tag };
    stats.claimed++;
    stats.tag = interaction.user.tag;
    this.staffStats.set(interaction.user.id, stats);

    // Update channel topic
    const ch = interaction.channel as TextChannel;
    await ch.setTopic(`🎫 ${ticket.category} | Opened by ${ticket.username} | Claimed by ${interaction.user.tag}`).catch(() => {});

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setDescription(`✅ <@${interaction.user.id}> has claimed this ticket and will be handling your request.`),
      ],
    });
  }

  private async handleTicketStatsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (this.staffStats.size === 0) {
      await this.safeReply(interaction, { content: "No ticket stats recorded yet this session." });
      return;
    }

    const sorted = [...this.staffStats.entries()]
      .sort(([, a], [, b]) => b.closed - a.closed);

    const rows = sorted.map(([, s], i) =>
      `**${i + 1}.** ${s.tag} — 🔒 ${s.closed} closed · 🙋 ${s.claimed} claimed`,
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📊 Support Staff — Ticket Stats")
      .setDescription(rows.join("\n"))
      .setFooter({ text: "Stats reset on bot restart" })
      .setTimestamp();

    await this.safeReply(interaction, { embeds: [embed] });
  }

  // ── License expiry notifications ───────────────────────────────

  async startExpiryNotifications(): Promise<void> {
    const check = async () => {
      try {
        const now = new Date();
        const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const in1 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

        const windowStart7 = new Date(in7); windowStart7.setHours(0, 0, 0, 0);
        const windowEnd7   = new Date(in7); windowEnd7.setHours(23, 59, 59, 999);
        const windowStart1 = new Date(in1); windowStart1.setHours(0, 0, 0, 0);
        const windowEnd1   = new Date(in1); windowEnd1.setHours(23, 59, 59, 999);

        const expiring = await prisma.license.findMany({
          where: {
            OR: [
              { expiresAt: { gte: windowStart7, lte: windowEnd7 } },
              { expiresAt: { gte: windowStart1, lte: windowEnd1 } },
            ],
          },
          select: { discordId: true, serverName: true, expiresAt: true, id: true },
        });

        for (const lic of expiring) {
          if (!lic.discordId || !lic.expiresAt) continue;
          const daysLeft = Math.round((lic.expiresAt.getTime() - now.getTime()) / 86400000);
          try {
            const user = await this.client.users.fetch(lic.discordId).catch(() => null);
            if (!user) continue;
            await user.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(daysLeft <= 1 ? 0xed4245 : 0xfee75c)
                  .setTitle(daysLeft <= 1 ? "⚠️ License Expiring Tomorrow!" : "🔔 License Expiring in 7 Days")
                  .setDescription(
                    `Your VexonAC license for **${lic.serverName}** expires ` +
                    `<t:${Math.floor(lic.expiresAt.getTime() / 1000)}:R>.\n\n` +
                    `Renew now at **vexonac.com** to keep your server protected without interruption.`,
                  )
                  .addFields({ name: "Server", value: lic.serverName, inline: true }, { name: "Days Left", value: String(daysLeft), inline: true })
                  .setFooter({ text: "VexonAC — Premium FiveM Anti-Cheat" })
                  .setTimestamp(),
              ],
            }).catch(() => {});
          } catch {}
        }
      } catch (err) {
        console.error("[Bot] expiry check error:", err);
      }
    };

    // Run once on startup, then every 24 hours
    await check();
    setInterval(check, 24 * 60 * 60 * 1000);
  }

  // ── Ticket system ─────────────────────────────────────────────

  private static readonly TICKET_CATEGORIES = [
    { value: "ban_appeal",    label: "🚫 Ban Appeal",         description: "Appeal a ban from a VexonAC server" },
    { value: "tech_support",  label: "🔧 Technical Support",  description: "Help with installation or setup issues" },
    { value: "key_issue",     label: "🔑 Key / License Issue", description: "Problem with your license key" },
    { value: "report_player", label: "🛡️ Report a Player",    description: "Report a cheater to server staff" },
    { value: "billing",       label: "💳 Billing / Purchase",  description: "Questions about purchasing a license" },
    { value: "other",         label: "📋 Other",               description: "Anything else" },
  ];

  private async handleSetupTicketsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const channelId = discordBotConfig.ticketChannelId;
    if (!channelId) {
      await this.safeReply(interaction, { content: "❌ `DISCORD_TICKET_CHANNEL_ID` is not set." });
      return;
    }
    try {
      const ch = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;
      if (!ch) { await this.safeReply(interaction, { content: "❌ Ticket channel not found." }); return; }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎫 VexonAC Support")
        .setDescription(
          "Need help? Click **Open Ticket** below and select the category that best describes your issue.\n\n" +
          DiscordBotService.TICKET_CATEGORIES.map((c) => `${c.label} — ${c.description}`).join("\n"),
        )
        .setFooter({ text: "VexonAC Support System • We'll respond as soon as possible" })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("📩  Open Ticket")
        .setStyle(ButtonStyle.Primary);

      await ch.send({
        embeds: [embed],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
      });
      await this.safeReply(interaction, { content: `✅ Ticket panel posted in <#${channelId}>.` });
    } catch (err) {
      console.error("[Bot] setup-tickets error:", err);
      await this.safeReply(interaction, { content: "Failed to post ticket panel." });
    }
  }

  private async handleOpenTicketButton(interaction: ButtonInteraction): Promise<void> {
    // Check if user already has an open ticket
    for (const [, ticket] of this.openTickets) {
      if (ticket.userId === interaction.user.id) {
        await interaction.reply({
          content: "❌ You already have an open ticket. Please close it before opening a new one.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId("ticket_category")
      .setPlaceholder("Select the category that best fits your issue...")
      .addOptions(
        DiscordBotService.TICKET_CATEGORIES.map((c) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(c.label)
            .setValue(c.value)
            .setDescription(c.description),
        ),
      );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("📩 Open a Support Ticket")
          .setDescription("Please choose a category for your ticket:"),
      ],
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleTicketCategorySelect(interaction: StringSelectMenuInteraction): Promise<void> {
    if (!interaction.guild) { await interaction.reply({ content: "Guild not found.", flags: MessageFlags.Ephemeral }); return; }

    const category = DiscordBotService.TICKET_CATEGORIES.find((c) => c.value === interaction.values[0]);
    if (!category) { await interaction.reply({ content: "Invalid category.", flags: MessageFlags.Ephemeral }); return; }

    await interaction.deferUpdate();

    try {
      const ticketNum = Math.floor(Math.random() * 9000) + 1000;
      const channelName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}-${ticketNum}`;

      const permOverwrites: any[] = [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
      ];

      if (discordBotConfig.supportRoleId) {
        permOverwrites.push({
          id: discordBotConfig.supportRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        });
      }
      if (discordBotConfig.adminRoleId) {
        permOverwrites.push({
          id: discordBotConfig.adminRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        });
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: discordBotConfig.ticketCategoryId || undefined,
        permissionOverwrites: permOverwrites,
      });

      this.openTickets.set(ticketChannel.id, {
        userId: interaction.user.id,
        username: interaction.user.tag,
        category: category.label,
        openedAt: new Date(),
      });

      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒  Close Ticket")
        .setStyle(ButtonStyle.Danger);

      await ticketChannel.send({
        content: `<@${interaction.user.id}>${discordBotConfig.supportRoleId ? ` <@&${discordBotConfig.supportRoleId}>` : ""}`,
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`${category.label}`)
            .setDescription(
              `Hello ${interaction.user}, thank you for opening a ticket!\n\n` +
              `**Category:** ${category.label}\n` +
              `**Opened:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
              `Please describe your issue in detail and our team will respond shortly.\n` +
              `When your issue is resolved, click **Close Ticket** below.`,
            )
            .setFooter({ text: `Ticket #${ticketNum} • VexonAC Support` })
            .setTimestamp(),
        ],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton)],
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`✅ Your ticket has been created: <#${ticketChannel.id}>`),
        ],
        components: [],
      });
    } catch (err) {
      console.error("[Bot] ticket create error:", err);
      await interaction.editReply({ content: "❌ Failed to create ticket channel.", components: [] });
    }
  }

  private async handleCloseTicketButton(interaction: ButtonInteraction): Promise<void> {
    await this.closeTicket(interaction, undefined);
  }

  private async handleCloseTicketCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const reason = interaction.options.getString("reason") ?? undefined;
    await this.closeTicket(interaction, reason);
  }

  private async closeTicket(
    interaction: ButtonInteraction | ChatInputCommandInteraction,
    reason?: string,
  ): Promise<void> {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({ content: "This command must be used inside a ticket channel.", flags: MessageFlags.Ephemeral });
      return;
    }

    const channelId = interaction.channelId;
    const ticket = this.openTickets.get(channelId);

    if (!ticket) {
      await interaction.reply({ content: "❌ This channel is not a VexonAC support ticket.", flags: MessageFlags.Ephemeral });
      return;
    }

    // Only ticket opener, support, and admins can close
    const member = interaction.member as GuildMember;
    const canClose =
      member.user.id === ticket.userId ||
      (discordBotConfig.supportRoleId && member.roles.cache.has(discordBotConfig.supportRoleId)) ||
      (discordBotConfig.adminRoleId && member.roles.cache.has(discordBotConfig.adminRoleId)) ||
      member.user.id === discordBotConfig.ownerId;

    if (!canClose) {
      await interaction.reply({ content: "❌ Only the ticket opener or support staff can close this ticket.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    try {
      const ch = interaction.channel as TextChannel;

      // Fetch all messages for transcript (up to 500)
      const allMessages: Message[] = [];
      let lastId: string | undefined;

      for (let i = 0; i < 5; i++) {
        const fetched = await ch.messages.fetch({ limit: 100, ...(lastId ? { before: lastId } : {}) });
        if (fetched.size === 0) break;
        allMessages.push(...fetched.values());
        lastId = fetched.last()?.id;
        if (fetched.size < 100) break;
      }

      allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      // Build plain-text transcript
      const transcript = this.buildTranscript(ticket, allMessages, reason);
      const transcriptBuffer = Buffer.from(transcript, "utf-8");
      const fileName = `transcript-${ticket.username.replace(/[^a-z0-9]/gi, "_")}-${Date.now()}.txt`;
      const attachment = new AttachmentBuilder(transcriptBuffer, { name: fileName });

      const summaryEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🔒 Ticket Closed")
        .addFields(
          { name: "Opened by",    value: ticket.username,                                  inline: true },
          { name: "Category",     value: ticket.category,                                  inline: true },
          { name: "Closed by",    value: interaction.user.tag,                             inline: true },
          { name: "Duration",     value: `${Math.round((Date.now() - ticket.openedAt.getTime()) / 60000)} min`, inline: true },
          { name: "Messages",     value: String(allMessages.filter((m) => !m.author.bot).length), inline: true },
          ...(reason ? [{ name: "Reason", value: reason, inline: false }] : []),
        )
        .setFooter({ text: "Transcript attached" })
        .setTimestamp();

      // DM the opener
      try {
        const opener = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
        if (opener) {
          await opener.user.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle("📋 Your ticket has been closed")
                .setDescription(
                  `Your support ticket **${ticket.category}** in **${interaction.guild.name}** was closed.\n` +
                  (reason ? `**Reason:** ${reason}\n` : "") +
                  `\nA transcript is attached below for your records.`,
                )
                .setFooter({ text: "VexonAC Support" })
                .setTimestamp(),
            ],
            files: [new AttachmentBuilder(transcriptBuffer, { name: fileName })],
          }).catch(() => {});
        }
      } catch {}

      // Post to log channel
      const logChannelId = discordBotConfig.ticketLogChannelId || discordBotConfig.logChannelId;
      if (logChannelId) {
        const logCh = interaction.guild.channels.cache.get(logChannelId) as TextChannel | undefined;
        if (logCh?.isTextBased()) {
          await logCh.send({ embeds: [summaryEmbed], files: [attachment] }).catch(() => {});
        }
      }

      await interaction.editReply({ content: "✅ Ticket closed. Transcript sent." });

      // Track staff close stat
      const closerId = interaction.user.id;
      const closerStats = this.staffStats.get(closerId) ?? { claimed: 0, closed: 0, tag: interaction.user.tag };
      closerStats.closed++;
      closerStats.tag = interaction.user.tag;
      this.staffStats.set(closerId, closerStats);

      this.openTickets.delete(channelId);

      // Delete channel after 5 seconds
      setTimeout(() => ch.delete("Ticket closed").catch(() => {}), 5000);
    } catch (err) {
      console.error("[Bot] close ticket error:", err);
      await interaction.editReply({ content: "❌ Failed to close ticket." }).catch(() => {});
    }
  }

  private buildTranscript(
    ticket: { userId: string; username: string; category: string; openedAt: Date },
    messages: Message[],
    reason?: string,
  ): string {
    const divider = "─".repeat(60);
    const openedAt = ticket.openedAt.toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const closedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const userMessages = messages.filter((m) => !m.author.bot);

    const lines: string[] = [
      "╔══════════════════════════════════════════════════════════╗",
      "║              VexonAC Support — Ticket Transcript         ║",
      "╚══════════════════════════════════════════════════════════╝",
      "",
      `  Category  : ${ticket.category}`,
      `  Opened by : ${ticket.username}`,
      `  Opened at : ${openedAt}`,
      `  Closed at : ${closedAt}`,
      `  Messages  : ${userMessages.length} (user), ${messages.length} (total)`,
      ...(reason ? [`  Reason    : ${reason}`] : []),
      "",
      divider,
      "",
    ];

    for (const m of messages) {
      const time = m.createdAt.toISOString().replace("T", " ").slice(0, 19) + " UTC";
      const tag = m.author.bot ? `${m.author.username} [BOT]` : m.author.tag;

      lines.push(`[${time}]  ${tag}`);

      if (m.content) {
        for (const line of m.content.split("\n")) {
          lines.push(`  ${line}`);
        }
      }

      for (const embed of m.embeds) {
        if (embed.title)       lines.push(`  [Embed] ${embed.title}`);
        if (embed.description) {
          for (const line of embed.description.split("\n")) {
            lines.push(`    ${line}`);
          }
        }
        for (const field of embed.fields) {
          lines.push(`    ${field.name}: ${field.value}`);
        }
      }

      if (m.attachments.size > 0) {
        for (const att of m.attachments.values()) {
          lines.push(`  [Attachment] ${att.name} — ${att.url}`);
        }
      }

      lines.push("");
    }

    lines.push(divider);
    lines.push("End of transcript");

    return lines.join("\n");
  }

  // ── Verification system ───────────────────────────────────────

  private async handleSetupVerifyCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channelId = discordBotConfig.verifyChannelId;
    const communityRoleId = discordBotConfig.communityRoleId;

    if (!channelId) {
      await this.safeReply(interaction, {
        content: "❌ `DISCORD_VERIFY_CHANNEL_ID` is not set in the environment.",
      });
      return;
    }
    if (!communityRoleId) {
      await this.safeReply(interaction, {
        content: "❌ `DISCORD_COMMUNITY_ROLE_ID` is not set in the environment.",
      });
      return;
    }

    try {
      const channel = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel) {
        await this.safeReply(interaction, { content: "❌ Verify channel not found. Check the channel ID." });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🛡️ VexonAC Community Verification")
        .setDescription(
          "Welcome to **VexonAC**!\n\n" +
          "To gain access to the community, click the **Verify** button below.\n\n" +
          "By verifying, you agree to follow our server rules.\n" +
          "If you are a customer, link your Discord in the panel at **vexonac.com** to unlock your customer perks.",
        )
        .setThumbnail(
          "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&",
        )
        .setFooter({ text: "VexonAC — Premium FiveM Anti-Cheat" })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId("vexonac_verify")
        .setLabel("✅  Verify")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      await channel.send({ embeds: [embed], components: [row] });

      await this.safeReply(interaction, {
        content: `✅ Verification message posted in <#${channelId}>.`,
      });
    } catch (err) {
      console.error("[Bot] setup-verify error:", err);
      await this.safeReply(interaction, { content: "Failed to post verification message." });
    }
  }

  private async handleVerifyButton(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "Could not verify — guild context missing.", flags: MessageFlags.Ephemeral });
      return;
    }

    const communityRoleId = discordBotConfig.communityRoleId;
    const unverifiedRoleId = discordBotConfig.autoRoleId;

    if (!communityRoleId) {
      await interaction.reply({ content: "❌ Verification is not configured yet. Contact an admin.", flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);

      // Already has community role
      if (member.roles.cache.has(communityRoleId)) {
        await interaction.reply({ content: "✅ You are already verified!", flags: MessageFlags.Ephemeral });
        return;
      }

      // Give community role
      await member.roles.add(communityRoleId);

      // Remove unverified/gate role if set
      if (unverifiedRoleId && member.roles.cache.has(unverifiedRoleId)) {
        await member.roles.remove(unverifiedRoleId).catch(() => {});
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ You're verified!")
            .setDescription(
              "Welcome to the **VexonAC** community! You now have access to all channels.\n\n" +
              "🔑 **Customer?** Link your Discord at **vexonac.com** to unlock your customer role and perks.",
            )
            .setFooter({ text: "VexonAC — Premium FiveM Anti-Cheat" }),
        ],
        flags: MessageFlags.Ephemeral,
      });

      // Welcome DM
      member.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("👋 Welcome to VexonAC!")
            .setDescription(
              `Hey **${member.user.username}**, welcome to the VexonAC community!\n\n` +
              `You're now verified and have full access to the server.\n\n` +
              `**Useful links:**\n` +
              `• 🌐 Dashboard — https://vexonac.com\n` +
              `• 📖 Docs — https://docs.vexonac.com\n` +
              `• 🎫 Need help? Open a ticket in the server\n` +
              `• 💬 Join the conversation in #general\n\n` +
              `If you're a customer, log in at **vexonac.com** with your Discord to access your panel.`,
            )
            .setFooter({ text: "VexonAC — Premium FiveM Anti-Cheat" })
            .setTimestamp(),
        ],
      }).catch(() => {}); // ignore if DMs are closed

      await this.sendModLog(
        interaction.guild,
        `✅ **${interaction.user.tag}** (${interaction.user.id}) verified`,
        0x57f287,
      );
    } catch (err) {
      console.error("[Bot] verify button error:", err);
      await interaction.reply({ content: "❌ Failed to verify you. Please contact an admin.", flags: MessageFlags.Ephemeral });
    }
  }

  private async handleNukeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    // Owner-only guard
    if (interaction.user.id !== discordBotConfig.ownerId) {
      await this.safeReply(interaction, {
        content: "❌ This command is restricted to the bot owner.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.type === ChannelType.DM) {
      await this.safeReply(interaction, { content: "❌ Can only nuke text channels." });
      return;
    }

    const amount = interaction.options.getInteger("amount") ?? 100;

    try {
      const textChannel = channel as TextChannel;
      const fetched = await textChannel.messages.fetch({ limit: amount });
      const deleted = await textChannel.bulkDelete(fetched, true); // true = skip messages >14d old
      await this.safeReply(interaction, {
        content: `🗑️ Deleted **${deleted.size}** message(s).`,
      });
    } catch (err) {
      console.error("[Bot] nuke error:", err);
      await this.safeReply(interaction, { content: "❌ Failed to delete messages. Bot may lack `Manage Messages` permission." });
    }
  }

  async registerSlashCommands() {
    try {
      const rest = new REST({ version: "10" }).setToken(discordBotConfig.token);

      // Convert SlashCommandBuilder instances to JSON
      const commandsJson = this.commands.map((command) => command.toJSON());

      console.info("Started refreshing application commands.");

      // Register commands globally or to a specific guild
      let data;
      if (discordBotConfig.guildId) {
        data = await rest.put(
          Routes.applicationGuildCommands(
            discordBotConfig.clientId,
            discordBotConfig.guildId
          ),
          { body: commandsJson }
        );
      } else {
        data = await rest.put(
          Routes.applicationCommands(discordBotConfig.clientId),
          { body: commandsJson }
        );
      }

      console.info(`Successfully reloaded application commands.`);
      return true;
    } catch (error) {
      console.error("Error registering slash commands", { error });
      return false;
    }
  }

  async start() {
    try {
      // Register slash commands
      await this.registerSlashCommands();

      // Login the bot
      await this.client.login(discordBotConfig.token);

      // Start daily license expiry notifications
      this.startExpiryNotifications().catch((e) => console.error("[Bot] expiry notifications failed to start:", e));

      return true;
    } catch (error) {
      console.error("Failed to start Discord bot", { error });
      return false;
    }
  }

  async stop() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }

    if (this.client) {
      this.client.destroy();
      console.info("Discord bot stopped");
    }
  }
}

export const discordBot = new DiscordBotService();


