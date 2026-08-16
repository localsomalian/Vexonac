// Configuration types with UI metadata
export type ConfigItemType =
  | "boolean"
  | "string"
  | "number"
  | "list"
  | "transferlist";

export interface ConfigItem<T> {
  value: T;
  label: string;
  tooltip: string;
  type: ConfigItemType;
  placeholder?: string;
  values?: Array<{ value: number | string; label: string }>;
}

// Main section config
export interface MainConfig {
  E1: ConfigItem<boolean>;
  E2: ConfigItem<boolean>;
  E3: ConfigItem<boolean>;
  E4: ConfigItem<boolean>;
  E5: ConfigItem<boolean>;
  E6: ConfigItem<boolean>;
  AntiLuaMenu: ConfigItem<boolean>;
  AntiTeleport: ConfigItem<boolean>;
  AntiNoClip: ConfigItem<boolean>;
  AntiFreeCam: ConfigItem<boolean>;
  AntiSpeedHack: ConfigItem<boolean>;
  AntiNoRagdoll: ConfigItem<boolean>;
  AntiSpectate: ConfigItem<boolean>;
  AntiInvisible: ConfigItem<boolean>;
  AntiSuperJump: ConfigItem<boolean>;
  AntiInfiniteStamina: ConfigItem<boolean>;
  AntiPedModelChange: ConfigItem<boolean>;
  AntiNightVisions: ConfigItem<boolean>;
  AntiAFKBypass: ConfigItem<boolean>;
  AntiInputBox: ConfigItem<boolean>;
  AntiInfiniteRefill: ConfigItem<boolean>;
  ClientReviveEvent: ConfigItem<string>;
  AntiOverrideHealthStats: ConfigItem<boolean>;
  AntiInvincible: ConfigItem<boolean>;
  AntiNoCombatDamages: ConfigItem<boolean>;
  AntiTriggerServerEventAI: ConfigItem<boolean>;
  AntiTriggerClientEventAI: ConfigItem<boolean>;
  AntiTriggerExportAI: ConfigItem<boolean>;
  AntiResourceStop: ConfigItem<boolean>;
  AntiResourceInjection: ConfigItem<boolean>;
  AntiClearTasks: ConfigItem<boolean>;
  AntiDevTools: ConfigItem<boolean>;
  AntiSpoofer: ConfigItem<boolean>;
  AntiVoiceExploits: ConfigItem<boolean>;
  IgnoredEvents: ConfigItem<string[]>;
}

// Weapons section config
export interface WeaponsConfig {
  AntiAimBot: ConfigItem<boolean>;
  AntiWeaponSpawner: ConfigItem<boolean>;
  AddonWeapons: ConfigItem<string[]>;
  AntiGiveWeapons: ConfigItem<boolean>;
  AntiRemoveWeapons: ConfigItem<boolean>;
  AntiSpoofedBullets: ConfigItem<boolean>;
  AntiKill: ConfigItem<boolean>;
  EnableWeaponsBlackList: ConfigItem<boolean>;
  BlackListedWeapons: ConfigItem<string[]>;
  AntiWeaponComponentModifier: ConfigItem<boolean>;
  AntiWeaponDamagesModifier: ConfigItem<boolean>;
  AntiAmmoCheating: ConfigItem<boolean>;
  AntiInfiniteAmmo: ConfigItem<boolean>;
  AntiNoReload: ConfigItem<boolean>;
  AntiExplosiveBullets: ConfigItem<boolean>;
  AntiSuperPunch: ConfigItem<boolean>;
  AntiHitboxModifier: ConfigItem<boolean>;
  AntiNoRecoil: ConfigItem<boolean>;
  EnableProjectilesWhiteList: ConfigItem<boolean>;
  WhiteListedProjectiles: ConfigItem<string[]>;
  EnableProjectilesLimiter: ConfigItem<boolean>;
  ProjectilesLimitIn5Seconds: ConfigItem<number>;
  LogProjectileSpawnsToConsole: ConfigItem<boolean>;
}

// Entities section config
export interface EntitiesConfig {
  EnableVehiclesAI: ConfigItem<boolean>;
  EnableVehiclesAIv2: ConfigItem<boolean>;
  AntiSpawnIsolatedVehicles: ConfigItem<boolean>;
  EnableVehiclesBlackList: ConfigItem<boolean>;
  EnableObjectsBlackList: ConfigItem<boolean>;
  EnablePedsBlackList: ConfigItem<boolean>;
  BlackListedPeds: ConfigItem<string[]>;
  BlackListedObjects: ConfigItem<string[]>;
  BlackListedVehicles: ConfigItem<string[]>;
  EnableVehiclesWhiteList: ConfigItem<boolean>;
  WhiteListedVehicles: ConfigItem<string[]>;
  DeleteVehicleOnDestroy: ConfigItem<boolean>;
  AntiThrowVehicles: ConfigItem<boolean>;
  EnableVehiclesLimiter: ConfigItem<boolean>;
  AntiDeleteVehicles: ConfigItem<boolean>;
  VehiclesLimitIn5Seconds: ConfigItem<number>;
  LogVehicleSpawnsToConsole: ConfigItem<boolean>;
  NoCarKill: ConfigItem<boolean>;
  AntiTeleportInVehicle: ConfigItem<boolean>;
  AntiSpeedModifier: ConfigItem<boolean>;
  AntiHandlingModifier: ConfigItem<boolean>;
  EnablePedsAI: ConfigItem<boolean>;
  EnablePedsAIv2: ConfigItem<boolean>;
  DisableNPCPopulation: ConfigItem<boolean>;
  EnablePedsWhiteList: ConfigItem<boolean>;
  WhiteListedPeds: ConfigItem<string[]>;
  EnablePedsLimiter: ConfigItem<boolean>;
  PedsLimitIn5Seconds: ConfigItem<number>;
  LogPedSpawnsToConsole: ConfigItem<boolean>;
  AntiVehiclePlateChanger: ConfigItem<boolean>;
  EnableObjectsAI: ConfigItem<boolean>;
  EnableObjectsWhiteList: ConfigItem<boolean>;
  WhiteListedObjects: ConfigItem<string[]>;
  AntiPickupSpawn: ConfigItem<boolean>;
  EnableObjectsLimiter: ConfigItem<boolean>;
  ObjectsLimitIn5Seconds: ConfigItem<number>;
  LogObjectSpawnsToConsole: ConfigItem<boolean>;
}

// Explosions section config
export interface ExplosionsConfig {
  EnableExplosionsAI: ConfigItem<boolean>;
  EnableParticlesAI: ConfigItem<boolean>;
  EnableExplosionsBlackList: ConfigItem<boolean>;
  BlackListedExplosions: ConfigItem<number[]>;
  DetectInvisibleExplosions: ConfigItem<boolean>;
  DetectInaudibleExplosions: ConfigItem<boolean>;
  EnableExplosionsLimiter: ConfigItem<boolean>;
  ExplosionsLimitIn5Seconds: ConfigItem<number>;
  CancelAllExplosions: ConfigItem<boolean>;
  CancelAllFires: ConfigItem<boolean>;
  LogExplosionSpawnsToConsole: ConfigItem<boolean>;
  EnableParticlesWhiteList: ConfigItem<boolean>;
  WhiteListedParticles: ConfigItem<string[]>;
  DetectParticlesAttachedToEntity: ConfigItem<boolean>;
  MaxParticleScale: ConfigItem<number>;
  LogParticleSpawnsToConsole: ConfigItem<boolean>;
}

// Premium section config
export interface PremiumConfig {
  AntiRequestControl: ConfigItem<boolean>;
  AntiSoundExploits: ConfigItem<boolean>;
  AntiRagdollExploit: ConfigItem<boolean>;
  AntiBombVehicles: ConfigItem<boolean>;
}

// Beta section config
export interface BetaConfig {
  AntiUnisolatedInjection: ConfigItem<boolean>;
  IgnoredExecutionPatterns: ConfigItem<string[]>;
  AntiMagneto: ConfigItem<boolean>;
  AntiAttachVehicles: ConfigItem<boolean>;
  AntiSilentAim: ConfigItem<boolean>;
}

// Settings section config
export interface SettingsConfig {
  EnableDiscordLogs: ConfigItem<boolean>;
  ShowIpAddress: ConfigItem<boolean>;
  MainWebhook: ConfigItem<string>;
  EntitiesWebhook: ConfigItem<string>;
  ExplosionsWebhook: ConfigItem<string>;
  WeaponsWebhook: ConfigItem<string>;
  UnbansWebhook: ConfigItem<string>;
  ConnectionsWebhook: ConfigItem<string>;
  CommunityLogsWebhook: ConfigItem<string>;
  GlobalBanWebhook: ConfigItem<string>;
  ScreenshotsWebhook: ConfigItem<string>;
  EnableBans: ConfigItem<boolean>;
  EnableScreenShots: ConfigItem<boolean>;
  EnableGameplayRecord: ConfigItem<boolean>;
  BanDuration: ConfigItem<number>;
  BanIpAddress: ConfigItem<boolean>;
  BanMessage: ConfigItem<string>;
  LogUnbansToDiscord: ConfigItem<boolean>;
  LogConnectionsToDiscord: ConfigItem<boolean>;
  LogConnectionsToConsole: ConfigItem<boolean>;
  LogOnConnect: ConfigItem<boolean>;
  LogOnDisconnect: ConfigItem<boolean>;
  MaxThreatScore: ConfigItem<number>;
  AntiVPN: ConfigItem<boolean>;
  AntiXSSInjections: ConfigItem<boolean>;
  AntiConnectionDupe: ConfigItem<boolean>;
  RequireDiscord: ConfigItem<boolean>;
  RequireAlphanumericName: ConfigItem<boolean>;
  EnableAntiBackdoors: ConfigItem<boolean>;
  StopServerWhenDetected: ConfigItem<boolean>;
  CommandPrefix: ConfigItem<string>;
  IgnoredScripts: ConfigItem<string[]>;
}

// Full config type
export interface VexonACConfig {
  Main: MainConfig;
  Weapons: WeaponsConfig;
  Entities: EntitiesConfig;
  Explosions: ExplosionsConfig;
  Premium: PremiumConfig;
  Beta: BetaConfig;
  Settings: SettingsConfig;
}

// Re-export the explosions list from the separate file
export { categories, explosionsList } from "./constants";

// Helper function to extract raw values for backend use
export function extractValues(config: VexonACConfig): Record<string, any> {
  const result: Record<string, any> = {};

  for (const categoryKey in config) {
    result[categoryKey] = {};
    const category = config[categoryKey as keyof VexonACConfig];

    for (const itemKey in category) {
      const configItem = (category as any)[itemKey];
      if (
        configItem &&
        typeof configItem === "object" &&
        "value" in configItem
      ) {
        result[categoryKey][itemKey] = configItem.value;
      }
    }
  }

  return result;
}

// Import the default config definition
import { defaultConfig } from "./defaultConfig";

// Export the default config
export const config = defaultConfig;
export const rawConfig = extractValues(defaultConfig);

// Export function to merge with custom values
export function mergeConfig(
  customValues: Record<string, any>
): VexonACConfig {
  const result = JSON.parse(JSON.stringify(defaultConfig)) as VexonACConfig;

  for (const categoryKey in customValues) {
    if (categoryKey in result) {
      const category = customValues[categoryKey];

      for (const itemKey in category) {
        if (itemKey in (result as any)[categoryKey]) {
          const typedCategory = (result as any)[categoryKey];
          const configItem = typedCategory[itemKey];
          if (
            configItem &&
            typeof configItem === "object" &&
            "value" in configItem
          ) {
            configItem.value = category[itemKey];
          }
        }
      }
    }
  }

  return result;
}

// Export function to merge with custom values
export function mergeRawConfig(
  customValues: Record<string, any>
): Record<string, any> {
  // Start with the default raw config structure as the source of truth
  const defaultRaw = extractValues(defaultConfig);
  const mergedRaw: Record<string, any> = {};

  // Process each category in the default config
  for (const categoryKey in defaultRaw) {
    mergedRaw[categoryKey] = {};
    const defaultCategory = defaultRaw[categoryKey];
    const customCategory = customValues[categoryKey] || {};

    // Process each item in the category
    for (const itemKey in defaultCategory) {
      // Use custom value if provided, otherwise use default value
      mergedRaw[categoryKey][itemKey] =
        customCategory[itemKey] !== undefined
          ? customCategory[itemKey]
          : defaultCategory[itemKey];
    }
  }

  return mergedRaw;
}

export default config;

