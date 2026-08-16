import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "@/lib/utils";
import { emitToServer } from "../../lib/emitToServer";

const executeCommandSchema = z.object({
	serverId: z.string(),
	command: z.string().min(1, "Command cannot be empty"),
});

// Simple in-process rate limiter: max 10 RCON commands per user per server per minute
const rconRateLimits = new Map<string, { count: number; windowStart: number }>();
setInterval(() => {
	const cutoff = Date.now() - 60_000;
	for (const [key, state] of rconRateLimits) {
		if (state.windowStart < cutoff) rconRateLimits.delete(key);
	}
}, 60_000);

function checkRconRateLimit(userId: string, serverId: string): boolean {
	const key = `${userId}:${serverId}`;
	const now = Date.now();
	let state = rconRateLimits.get(key);
	if (!state || now - state.windowStart > 60_000) {
		state = { count: 0, windowStart: now };
		rconRateLimits.set(key, state);
	}
	state.count++;
	return state.count <= 10;
}

export const executeCommand = protectedProcedure
	.input(executeCommandSchema)
	.mutation(async ({ ctx, input }) => {
		const { serverId, command } = input;
		const userId = ctx.session.user.discordId;
		const username = ctx.session.user.name || "Web Panel User";

		// Check if user has access to this server
		const server = await ctx.db.license.findUnique({
			where: {
				id: serverId,
			},
			select: {
				id: true,
				discordId: true,
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

		if (!server) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Server not found or access denied",
			});
		}

		const isOwner = server.discordId === userId;
		const member = server.members[0];
		const hasRunCommandsPermission = hasPermission(
			member?.permissions || [],
			"RUN_COMMANDS"
		);

		if (!isOwner && !hasRunCommandsPermission) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have permission to run commands on this server",
			});
		}

		if (!checkRconRateLimit(userId, serverId)) {
			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: "Rate limit exceeded: max 10 commands per minute per server",
			});
		}

		try {
			// Emit the command to the ingress API which will forward it to the FiveM server
			await emitToServer(serverId, "console:command", { command, username }, true);

			return {
				success: true,
				message: "Command sent successfully",
			};
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to send command to server",
			});
		}
	});
