import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import fs from "fs";
import path from "path";
import { protectedProcedure } from "../../lib/trpc";
import { appendToZip } from "../../lib/zip-utils";

export const downloadAntiCheat = protectedProcedure.mutation(
  async ({ ctx }) => {
    const userId = ctx.session.user.discordId;

    try {
      // Find all licenses where user is owner or member
      const licenses = await ctx.db.license.findMany({
        where: {
          OR: [
            {
              discordId: userId, // User owns the license
            },
            {
              members: {
                some: {
                  discordId: userId, // User is a member of the license
                },
              },
            },
          ],
        },
        include: {
          members: {
            where: {
              discordId: userId,
            },
            select: {
              permissions: true,
            },
          },
        },
      });

      if (licenses.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No licenses found",
        });
      }

      // Check if any license owned by the user is banned
      const bannedLicense = licenses.find(lic => lic.isBanned && lic.discordId === userId);
      if (bannedLicense) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have a banned license and cannot download anti-cheat files",
        });
      }

      // Check if all licenses are expired
      const allExpired = licenses.every(lic => lic.expiresAt < new Date());
      if (allExpired) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "All your licenses have expired",
        });
      }

      // Find a license where user has permission to download and is not expired
      const license = licenses.find(lic => {
        const isOwner = lic.discordId === userId;
        const isMember = lic.members.length > 0;
        const hasDownloadPermission = isMember && hasPermission(
          lic.members[0].permissions,
          "DOWNLOAD_FILES"
        );
        const isNotExpired = lic.expiresAt >= new Date();
        
        return (isOwner || hasDownloadPermission) && isNotExpired;
      });

      if (!license) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to download anti-cheat files",
        });
      }

      // No need to check expiration or ban status again since we already filtered for them above

      // Path to the zip file
      const zipPath = path.join(process.cwd(), "assets", "VexonAC.zip");

      // Check if the file exists
      if (!fs.existsSync(zipPath)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Anti-cheat file not found",
        });
      }

      // Get current version from DB
      const versionRow = await ctx.db.version.findFirst({ orderBy: { updatedAt: "desc" } });
      const version = versionRow?.version ?? "1.0.0";

      // Read the base zip and inject auth files with the user's key pre-filled
      const baseZip = fs.readFileSync(zipPath);
      const customZip = appendToZip(baseZip, [
        { name: "VexonAC/auth/license.txt", content: Buffer.from(license.licenseKey, "utf8") },
        { name: "VexonAC/auth/version.txt", content: Buffer.from(version, "utf8") },
      ]);
      const base64Zip = customZip.toString("base64");

      // Log the download activity
      await ctx.db.serverLog.create({
        data: {
          systemType: "DOWNLOAD",
          licenseId: license.id,
          memberId: userId,
        },
      });

      return {
        fileName: "VexonAC.zip",
        fileContent: base64Zip,
        licenseKey: license.licenseKey,
        serverName: license.serverName,
        expiresAt: license.expiresAt,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("Error downloading anti-cheat:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to download anti-cheat",
      });
    }
  }
);

