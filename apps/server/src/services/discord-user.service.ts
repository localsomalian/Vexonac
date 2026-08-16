import prisma from "../../prisma";
import discordBotConfig from "../lib/discord-bot.config";

interface DiscordUserJoinResult {
  success: boolean;
  message: string;
  status?: number;
  alreadyMember?: boolean;
}

interface DiscordRoleResult {
  success: boolean;
  message: string;
  status?: number;
}

class DiscordUserService {
  private readonly discordApiBaseUrl = "https://discord.com/api/v10";

  /**
   * Helper method to perform fetch with rate limit handling (429)
   */
  private async makeDiscordRequest(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    const response = await fetch(url, options);

    if (response.status === 429) {
      if (attempt > 3) return response; // Stop after 3 retries

      try {
        // Clone response to read body without consuming original stream (if needed later)
        // But here we just need retry_after
        const errorData = await response.clone().json();
        
        // Discord returns retry_after in seconds, we convert to ms
        const retryAfter = (errorData.retry_after || 1) * 1000;
        
        console.warn(
          `Rate limited (Discord API). Retrying after ${retryAfter}ms`,
          { url, attempt }
        );

        await new Promise((resolve) => setTimeout(resolve, retryAfter + 200)); // Add 200ms buffer
        
        return this.makeDiscordRequest(url, options, attempt + 1);
      } catch (e) {
        console.error("Failed to parse rate limit response", e);
        return response;
      }
    }

    return response;
  }

  /**
   * Automatically join a user to the Discord server using their access token
   */
  async joinUserToGuild(userId: string): Promise<DiscordUserJoinResult> {
    try {
      const accessToken = await this.getUserDiscordToken(userId);
      if (!accessToken) {
        return {
          success: false,
          message: "User does not have a Discord access token",
        };
      }

      const response = await this.makeDiscordRequest(
        `${this.discordApiBaseUrl}/guilds/${discordBotConfig.guildId}/members/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${discordBotConfig.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        }
      );

      if (response.status === 201) {
        return {
          success: true,
          message: "Successfully joined Discord server",
        };
      } else if (response.status === 204) {
        console.info("User is already a member of Discord server", { userId });
        return {
          success: true,
          message: "User is already a member",
          alreadyMember: true,
        };
      }

      // Handle specific error status codes
      if (response.status === 403) {
        const errorData = await response.text();
        console.error("Discord API 403 error", { userId, error: errorData });
        return {
          success: false,
          message: "Bot lacks permissions to add members to the server",
          status: 403,
        };
      } else if (response.status === 404) {
        const errorData = await response.text();
        console.error("Discord API 404 error", { userId, error: errorData });
        return {
          success: false,
          message: "Discord server, bot, or user not found",
          status: 404,
        };
      } else if (response.status === 400) {
        const errorData = await response.text();
        console.error("Discord API 400 error", { userId, error: errorData });
        return {
          success: false,
          message: "Invalid request or user access token expired",
          status: 400,
        };
      }

      const errorData = await response.text();
      console.error("Unexpected Discord API response", {
        userId,
        status: response.status,
        error: errorData,
      });
      return {
        success: false,
        message: `Unexpected response from Discord API (${response.status})`,
        status: response.status,
      };
    } catch (error: any) {
      console.error("Failed to join user to Discord server", {
        userId,
        error: error.message,
      });

      if (error.status === 403) {
        return {
          success: false,
          message: "Bot lacks permissions to add members to the server",
        };
      }

      if (error.status === 404) {
        return {
          success: false,
          message: "Discord server or user not found",
        };
      }

      return {
        success: false,
        message: "Failed to join Discord server",
      };
    }
  }

  /**
   * Add customer role to a Discord user
   */
  async addCustomerRole(userId: string): Promise<DiscordRoleResult> {
    try {
      if (!discordBotConfig.customerRoleId) {
        console.warn("Customer role ID not configured");
        return {
          success: false,
          message: "Customer role ID not configured",
        };
      }

      const response = await this.makeDiscordRequest(
        `${this.discordApiBaseUrl}/guilds/${discordBotConfig.guildId}/members/${userId}/roles/${discordBotConfig.customerRoleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${discordBotConfig.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 204) {
        console.info("Customer role added successfully", { userId });
        return {
          success: true,
          message: "Customer role added successfully",
        };
      }

      // Handle specific error status codes
      if (response.status === 403) {
        const errorData = await response.text();
        console.error("Discord API 403 error (add role)", {
          userId,
          error: errorData,
        });
        return {
          success: false,
          message: "Bot lacks permissions to manage roles",
          status: 403,
        };
      } else if (response.status === 404) {
        const errorData = await response.text();
        console.error("Discord API 404 error (add role)", {
          userId,
          error: errorData,
        });
        return {
          success: false,
          message: "Discord server, user, or role not found",
          status: 404,
        };
      }

      const errorData = await response.text();
      console.error("Unexpected Discord API response (add role)", {
        userId,
        status: response.status,
        error: errorData,
      });
      return {
        success: false,
        message: `Unexpected response from Discord API (${response.status})`,
        status: response.status,
      };
    } catch (error: any) {
      console.error("Failed to add customer role", {
        userId,
        error: error.message,
      });

      if (error.status === 403) {
        return {
          success: false,
          message: "Bot lacks permissions to manage roles",
        };
      }

      if (error.status === 404) {
        return {
          success: false,
          message: "Discord server, user, or role not found",
        };
      }

      return {
        success: false,
        message: "Failed to add customer role",
      };
    }
  }

  /**
   * Remove customer role from a Discord user
   */
  async removeCustomerRole(userId: string): Promise<DiscordRoleResult> {
    try {
      if (!discordBotConfig.customerRoleId) {
        console.warn("Customer role ID not configured");
        return {
          success: false,
          message: "Customer role ID not configured",
        };
      }

      const response = await this.makeDiscordRequest(
        `${this.discordApiBaseUrl}/guilds/${discordBotConfig.guildId}/members/${userId}/roles/${discordBotConfig.customerRoleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bot ${discordBotConfig.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 204) {
        console.info("Customer role removed successfully", { userId });
        return {
          success: true,
          message: "Customer role removed successfully",
        };
      }

      // Handle specific error status codes
      if (response.status === 403) {
        const errorData = await response.text();
        console.error("Discord API 403 error (remove role)", {
          userId,
          error: errorData,
        });
        return {
          success: false,
          message: "Bot lacks permissions to manage roles",
          status: 403,
        };
      } else if (response.status === 404) {
        const errorData = await response.text();
        console.error("Discord API 404 error (remove role)", {
          userId,
          error: errorData,
        });
        return {
          success: false,
          message: "Discord server, user, or role not found",
          status: 404,
        };
      }

      const errorData = await response.text();
      console.error("Unexpected Discord API response (remove role)", {
        userId,
        status: response.status,
        error: errorData,
      });
      return {
        success: false,
        message: `Unexpected response from Discord API (${response.status})`,
        status: response.status,
      };
    } catch (error: any) {
      console.error("Failed to remove customer role", {
        userId,
        error: error.message,
      });

      if (error.status === 403) {
        return {
          success: false,
          message: "Bot lacks permissions to manage roles",
        };
      }

      if (error.status === 404) {
        return {
          success: false,
          message: "Discord server, user, or role not found",
        };
      }

      return {
        success: false,
        message: "Failed to remove customer role",
      };
    }
  }

  /**
   * Check if a user is a member of the Discord server
   */
  async isUserMember(userId: string): Promise<boolean> {
    try {
      const response = await this.makeDiscordRequest(
        `${this.discordApiBaseUrl}/guilds/${discordBotConfig.guildId}/members/${userId}`,
        {
          headers: {
            Authorization: `Bot ${discordBotConfig.token}`,
          },
        }
      );

      return response.status === 200;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }

      console.error("Failed to check user membership", {
        userId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get user's Discord access token from the database
   */
  async getUserDiscordToken(userId: string): Promise<string | null> {
    try {
      // Find the Discord account for this user
      const account = await prisma.account.findFirst({
        where: {
          accountId: userId,
          providerId: "discord",
        },
      });

      return account?.accessToken || null;
    } catch (error) {
      console.error("Failed to get user Discord token", { userId, error });
      return null;
    }
  }
}

export const discordUserService = new DiscordUserService();
