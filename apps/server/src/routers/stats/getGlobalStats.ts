import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../lib/trpc";

export const getGlobalStats = protectedProcedure.query(async ({ ctx }) => {
  try {
    // Get last 24 hours of global stats
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const globalStats = await ctx.db.globalStats.findMany({
      where: {
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    // Get current stats (latest entry)
    const currentStats = globalStats[globalStats.length - 1];

    // Get 24h ago stats (first entry)
    const twentyFourHoursAgoStats = globalStats[0];

    // Calculate trends (percentage and absolute changes)
    const calculateTrend = (current: number, previous: number) => {
      if (!previous || previous === 0) {
        return { percentageChange: 0, absoluteChange: current };
      }
      const percentageChange = ((current - previous) / previous) * 100;
      const absoluteChange = current - previous;
      return { percentageChange, absoluteChange };
    };

    const serversTrend = calculateTrend(
      currentStats?.onlineServers || 0,
      twentyFourHoursAgoStats?.onlineServers || 0
    );

    const playersTrend = calculateTrend(
      currentStats?.onlinePlayers || 0,
      twentyFourHoursAgoStats?.onlinePlayers || 0
    );

    // Transform data for chart
    const chartData = globalStats.map((stat) => ({
      timestamp: stat.timestamp.toISOString(),
      onlineServers: stat.onlineServers,
      onlinePlayers: stat.onlinePlayers,
      totalServers: stat.totalServers,
    }));

    // Calculate peak values for the 24h period
    const peakOnlineServers = Math.max(
      ...globalStats.map((s) => s.onlineServers),
      0
    );
    const peakOnlinePlayers = Math.max(
      ...globalStats.map((s) => s.onlinePlayers),
      0
    );

    return {
      chartData,
      current: {
        onlineServers: currentStats?.onlineServers || 0,
        onlinePlayers: currentStats?.onlinePlayers || 0,
        totalServers: currentStats?.totalServers || 0,
      },
      peaks: {
        onlineServers: peakOnlineServers,
        onlinePlayers: peakOnlinePlayers,
      },
      trends: {
        servers: {
          percentageChange: Math.round(serversTrend.percentageChange * 10) / 10,
          absoluteChange: serversTrend.absoluteChange,
          isPositive: serversTrend.absoluteChange >= 0,
        },
        players: {
          percentageChange: Math.round(playersTrend.percentageChange * 10) / 10,
          absoluteChange: playersTrend.absoluteChange,
          isPositive: playersTrend.absoluteChange >= 0,
        },
      },
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Error fetching global statistics",
    });
  }
});
