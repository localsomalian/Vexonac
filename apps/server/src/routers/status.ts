import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { protectedProcedure, publicProcedure, router } from "../lib/trpc"

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (ctx.session.user.discordId !== process.env.DISCORD_OWNER_ID) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" })
	}
	return next({ ctx })
})

export const statusRouter = router({
	// ─── Public ─────────────────────────────────────────────────────────────────
	getPublic: publicProcedure.query(async ({ ctx }) => {
		const now = new Date()

		const [activeIncidents, upcomingMaintenance, recentResolved] = await Promise.all([
			ctx.db.statusIncident.findMany({
				where: { status: { not: "resolved" } },
				include: { updates: { orderBy: { createdAt: "desc" } } },
				orderBy: { createdAt: "desc" },
			}),
			ctx.db.statusMaintenance.findMany({
				where: {
					status: { in: ["scheduled", "in_progress"] },
					scheduledEnd: { gt: now },
				},
				orderBy: { scheduledStart: "asc" },
			}),
			ctx.db.statusIncident.findMany({
				where: { status: "resolved" },
				include: { updates: { orderBy: { createdAt: "asc" } } },
				orderBy: { resolvedAt: "desc" },
				take: 10,
			}),
		])

		// Compute overall status
		let overallStatus: "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance" = "operational"

		const activeMaintenance = upcomingMaintenance.filter(m => m.status === "in_progress")
		if (activeMaintenance.length > 0) {
			overallStatus = "maintenance"
		}
		for (const inc of activeIncidents) {
			if (inc.impact === "critical") { overallStatus = "major_outage"; break }
			if (inc.impact === "major") overallStatus = "partial_outage"
			if (inc.impact === "minor" && overallStatus === "operational") overallStatus = "degraded"
		}

		return { overallStatus, activeIncidents, upcomingMaintenance, recentResolved }
	}),

	// ─── Admin ───────────────────────────────────────────────────────────────────
	getAll: adminProcedure.query(async ({ ctx }) => {
		const [incidents, maintenance] = await Promise.all([
			ctx.db.statusIncident.findMany({
				include: { updates: { orderBy: { createdAt: "asc" } } },
				orderBy: { createdAt: "desc" },
				take: 50,
			}),
			ctx.db.statusMaintenance.findMany({
				orderBy: { scheduledStart: "desc" },
				take: 50,
			}),
		])
		return { incidents, maintenance }
	}),

	createIncident: adminProcedure
		.input(z.object({
			title: z.string().min(1),
			impact: z.enum(["none", "minor", "major", "critical"]),
			status: z.enum(["investigating", "identified", "monitoring"]),
			message: z.string().min(1),
		}))
		.mutation(async ({ ctx, input }) => {
			const incident = await ctx.db.statusIncident.create({
				data: {
					title: input.title,
					impact: input.impact,
					status: input.status,
					updates: {
						create: { message: input.message, status: input.status },
					},
				},
				include: { updates: true },
			})
			return incident
		}),

	addIncidentUpdate: adminProcedure
		.input(z.object({
			incidentId: z.string(),
			message: z.string().min(1),
			status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
		}))
		.mutation(async ({ ctx, input }) => {
			const isResolving = input.status === "resolved"
			const [update] = await ctx.db.$transaction([
				ctx.db.statusIncidentUpdate.create({
					data: {
						incidentId: input.incidentId,
						message: input.message,
						status: input.status,
					},
				}),
				ctx.db.statusIncident.update({
					where: { id: input.incidentId },
					data: {
						status: input.status,
						...(isResolving ? { resolvedAt: new Date() } : {}),
					},
				}),
			])
			return update
		}),

	deleteIncident: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.statusIncident.delete({ where: { id: input.id } })
			return { success: true }
		}),

	createMaintenance: adminProcedure
		.input(z.object({
			title: z.string().min(1),
			description: z.string().optional(),
			scheduledStart: z.string(),
			scheduledEnd: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const maintenance = await ctx.db.statusMaintenance.create({
				data: {
					title: input.title,
					description: input.description,
					scheduledStart: new Date(input.scheduledStart),
					scheduledEnd: new Date(input.scheduledEnd),
				},
			})
			return maintenance
		}),

	updateMaintenanceStatus: adminProcedure
		.input(z.object({
			id: z.string(),
			status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
		}))
		.mutation(async ({ ctx, input }) => {
			const data: any = { status: input.status }
			if (input.status === "completed" || input.status === "cancelled") {
				data.actualEnd = new Date()
			}
			const updated = await ctx.db.statusMaintenance.update({
				where: { id: input.id },
				data,
			})
			return updated
		}),

	deleteMaintenance: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.statusMaintenance.delete({ where: { id: input.id } })
			return { success: true }
		}),
})
