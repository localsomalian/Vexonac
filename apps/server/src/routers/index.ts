import { publicProcedure, router } from "../lib/trpc";
import { adminRouter } from "./admin";
import { adminAuthRouter } from "./adminAuth";
import { getGlobalDiscount } from "./discounts/getGlobalDiscount";
import { validateDiscount } from "./discounts/validateDiscount";
import { eventEmit } from "./fivem/event";
import { downloadAntiCheat } from "./licenses/downloadAntiCheat";
import { redeemLicenseKey } from "./licenses/redeemLicenseKey";
import { addServerMember } from "./servers/addServerMember";
import { banPlayer } from "./servers/banPlayer";
import { browseConfigs, trackImport } from "./servers/browseConfigs";
import { deleteServer } from "./servers/deleteServer";
import { executeCommand } from "./servers/executeCommand";
import { getBans } from "./servers/getBans";
import { getConfig } from "./servers/getConfig";
import { getCurrentPlayers } from "./servers/getCurrentPlayers";
import { getLogs, getLogsAnalytics } from "./servers/getLogs";
import { getDetections, getDetectionStats, getPlayerDetections } from "./servers/getDetections";
import { getPlayerNotes, addPlayerNote, deletePlayerNote } from "./servers/playerNotes";
import { exportBans } from "./servers/exportBans";
import { testWebhook } from "./servers/testWebhook";
import { getTrustedPlayers, addTrustedPlayer, removeTrustedPlayer } from "./servers/trustedPlayers";
import { getPlayerCrossBans } from "./servers/getPlayerCrossBans";
import { getPlayerLookupDetails } from "./servers/getPlayerLookupDetails";
import { getPlayers } from "./servers/getPlayers";
import { getServer } from "./servers/getServer";
import { getServerAnalytics } from "./servers/getServerAnalytics";
import { getServerMembers } from "./servers/getServerMembers";
import { importConfig } from "./servers/importConfig";
import {
  deleteConfig,
  getConfigDetails,
  getUserConfigs,
  updateConfig,
} from "./servers/manageConfigs";
import { removeServerMember } from "./servers/removeServerMember";
import { resetIp } from "./servers/resetIp";
import { searchPlayersLookup } from "./servers/searchPlayersLookup";
import { searchUsers } from "./servers/searchUsers";
import { setConfig } from "./servers/setConfig";
import { shareConfig } from "./servers/shareConfig";
import { unbanAll } from "./servers/unbanAll";
import { unbanPlayer } from "./servers/unbanPlayer";
import { updateServerMember } from "./servers/updateServerMember";
import { renameServer } from "./servers/renameServer";
import { getGlobalStats } from "./stats/getGlobalStats";
import { getUserServersList } from "./users/getUserServersList";
import { getGitHubCommits } from "./versions/getGitHubCommits";
import { getLatestVersion } from "./versions/getLatestVersion";
import { webrtcRouter } from "./webrtc";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  updateApiKey,
} from "./api-keys";
import { statusRouter } from "./status";
import { listApprovedGlobalBans, submitToGlobalBan } from "./globalBans";
import { chatRouter } from "./chat";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  users: router({
    getUserServersList: getUserServersList,
  }),
  licenses: router({
    redeemLicenseKey: redeemLicenseKey,
    downloadAntiCheat: downloadAntiCheat,
  }),
  versions: router({
    getGitHubCommits: getGitHubCommits,
    getLatestVersion: getLatestVersion,
  }),
  stats: router({
    getGlobalStats: getGlobalStats,
  }),
  servers: router({
    getCurrentPlayers: getCurrentPlayers,
    getServer: getServer,
    getServerAnalytics: getServerAnalytics,
    resetIp: resetIp,
    deleteServer: deleteServer,
    executeCommand: executeCommand,
    getConfig: getConfig,
    setConfig: setConfig,
    shareConfig: shareConfig,
    importConfig: importConfig,
    browseConfigs: browseConfigs,
    trackImport: trackImport,
    getUserConfigs: getUserConfigs,
    updateConfig: updateConfig,
    deleteConfig: deleteConfig,
    getConfigDetails: getConfigDetails,
    getServerMembers: getServerMembers,
    addServerMember: addServerMember,
    updateServerMember: updateServerMember,
    removeServerMember: removeServerMember,
    searchUsers: searchUsers,
    getBans: getBans,
    banPlayer: banPlayer,
    unbanPlayer: unbanPlayer,
    unbanAll: unbanAll,
    getPlayers: getPlayers,
    getPlayerCrossBans: getPlayerCrossBans,
    searchPlayersLookup: searchPlayersLookup,
    getPlayerLookupDetails: getPlayerLookupDetails,
    getLogs: getLogs,
    getLogsAnalytics: getLogsAnalytics,
    getDetections: getDetections,
    getDetectionStats: getDetectionStats,
    getPlayerDetections: getPlayerDetections,
    renameServer: renameServer,
    getPlayerNotes: getPlayerNotes,
    addPlayerNote: addPlayerNote,
    deletePlayerNote: deletePlayerNote,
    exportBans: exportBans,
    testWebhook: testWebhook,
    getTrustedPlayers: getTrustedPlayers,
    addTrustedPlayer: addTrustedPlayer,
    removeTrustedPlayer: removeTrustedPlayer,
  }),
  fivem: router({
    event: eventEmit,
  }),
  discounts: router({
    getGlobalDiscount: getGlobalDiscount,
    validateDiscount: validateDiscount,
  }),
  apikeys: router({
    create: createApiKey,
    list: listApiKeys,
    update: updateApiKey,
    delete: deleteApiKey,
  }),
  globalBans: router({
    list:   listApprovedGlobalBans,
    submit: submitToGlobalBan,
  }),
  chat: chatRouter,
  webrtc: webrtcRouter,
  admin: adminRouter,
  adminAuth: adminAuthRouter,
  status: statusRouter,
});
export type AppRouter = typeof appRouter;
