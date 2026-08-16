import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Prisma } from "@vexonac/database";
import { protectedProcedure } from "../../lib/trpc";
import { discordUserService } from "../../services/discord-user.service";
import { discordBot } from "../../lib/discord-bot.service";

// Schema for redeeming a license key
const redeemSchema = z.object({
  licenseKey: z.string().min(1, "License key is required"),
  serverOption: z.enum(["new", "existing"]),
  existingServerId: z.string().optional(),
});

// Helper function to calculate expiration date based on license type
function calculateExpirationDate(licenseType: string): Date {
  const now = new Date();

  switch (licenseType) {
    case "TRIAL":
      // Add 3 days
      now.setDate(now.getDate() + 3);
      break;  
    case "MONTHLY":
      // Add 30 days
      now.setDate(now.getDate() + 30);
      break;
    case "QUARTERLY":
      // Add 3 months
      now.setMonth(now.getMonth() + 3);
      break;
    case "BIANUALLY":
      // Add 6 months
      now.setMonth(now.getMonth() + 6);
      break;
    case "YEARLY":
      // Add 1 year
      now.setFullYear(now.getFullYear() + 1);
      break;
    case "LIFETIME":
      // Set to a far future date (e.g., 100 years)
      now.setFullYear(now.getFullYear() + 100);
      break;
    default:
      // Default to 1 year if type is unknown
      now.setFullYear(now.getFullYear() + 1);
  }

  return now;
}

export const redeemLicenseKey = protectedProcedure
  .input(redeemSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;
    const licenseKey = input.licenseKey.trim();

    try {
      // Wrap DB operations in a transaction to prevent TOCTOU race on key redemption
      const result: { success: boolean; licenseId: string; serverName: string; message: string; expiresAt: Date } = await (
        ctx.db.$transaction as (fn: (tx: Prisma.TransactionClient) => Promise<any>) => Promise<any>
      )(async (tx) => {
        const alreadyRedeemed = await tx.license.findFirst({
          where: { licenseKey },
        });

        if (alreadyRedeemed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "License key already redeemed",
          });
        }

        const redemptionKey = await tx.redemptionKey.findUnique({
          where: { licenseKey },
        });

        if (!redemptionKey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invalid license key",
          });
        }

        const expirationDate = calculateExpirationDate(redemptionKey.type);
        let txResult: any;

        if (input.serverOption === "new") {
          const newLicense = await tx.license.create({
            data: {
              discordId: userId,
              expiresAt: expirationDate,
              licenseKey: licenseKey,
              members: {
                create: {
                  discordId: userId,
                  permissions: ["ALL"],
                },
              },
            },
          });

          await tx.serverLog.create({
            data: {
              licenseId: newLicense.id,
              systemType: "SERVER_CREATE",
              memberId: userId,
            },
          });

          txResult = {
            success: true,
            licenseId: newLicense.id,
            serverName: newLicense.serverName,
            message: `License key redeemed successfully. New server created.`,
            expiresAt: expirationDate,
          };
        } else if (input.serverOption === "existing") {
          if (!input.existingServerId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Existing server ID is required",
            });
          }

          const existingLicense = await tx.license.findFirst({
            where: {
              id: input.existingServerId,
              discordId: userId,
            },
          });

          if (!existingLicense) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to update this server",
            });
          }

          let newExpiryDate: Date;

          if (redemptionKey.type === "LIFETIME") {
            newExpiryDate = calculateExpirationDate("LIFETIME");
          } else {
            const startDate =
              existingLicense.expiresAt > new Date()
                ? existingLicense.expiresAt
                : new Date();
            newExpiryDate = new Date(startDate);

            switch (redemptionKey.type) {
              case "TRIAL":
                newExpiryDate.setDate(newExpiryDate.getDate() + 3);
                break;
              case "MONTHLY":
                newExpiryDate.setDate(newExpiryDate.getDate() + 30);
                break;
              case "QUARTERLY":
                newExpiryDate.setMonth(newExpiryDate.getMonth() + 3);
                break;
              case "BIANUALLY":
                newExpiryDate.setMonth(newExpiryDate.getMonth() + 6);
                break;
              case "YEARLY":
                newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
                break;
            }
          }

          const updatedLicense = await tx.license.update({
            where: { id: input.existingServerId },
            data: { expiresAt: newExpiryDate },
          });

          await tx.serverLog.create({
            data: {
              licenseId: updatedLicense.id,
              systemType: "SERVER_RENEW",
              memberId: userId,
            },
          });

          txResult = {
            success: true,
            licenseId: updatedLicense.id,
            serverName: updatedLicense.serverName,
            message: `License renewed successfully.`,
            expiresAt: newExpiryDate,
          };
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid server option",
          });
        }

        // Delete the redemption key within the same transaction
        await tx.redemptionKey.delete({ where: { licenseKey } });

        return txResult;
      });

      // Discord operations run after the transaction commits (non-blocking)
      try {
        const isMember = await discordUserService.isUserMember(userId);
        if (!isMember) {
          await discordUserService.joinUserToGuild(userId);
        }

        await discordUserService.addCustomerRole(userId);

        discordBot.sendOnboardingDM(userId, result.serverName, result.licenseId, result.expiresAt).catch(() => {});
      } catch (error) {
        console.error(
          "Error during Discord operations after license redemption",
          { userId, licenseKey, error }
        );
      }

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error redeeming license key:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while redeeming the license key",
      });
    }
  });
