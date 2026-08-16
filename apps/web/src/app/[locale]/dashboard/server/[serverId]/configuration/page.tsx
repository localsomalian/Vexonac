"use client";
import { ConfigOptionCard } from "@/components/ConfigOptionCard";
import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VexonACConfig } from "@vexonac/config";
import { categories, config as defaultConfig } from "@vexonac/config";
import type { Permission } from "@vexonac/database";
import {
  Ban,
  Check,
  FileWarning,
  Import,
  Loader2,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

// Predefined tags for sharing (must match backend)
const SHARE_TAGS = [
  "Role-Play",
  "PvP",
  "Strict",
  "Performance",
  "Balanced",
] as const;

// Define category icons map
const categoryIcons: Record<string, React.ReactNode> = {
  Main: <ShieldCheck className="size-5" />,
  Weapons: <Ban className="size-5" />,
  Entities: <Shield className="size-5" />,
  Explosions: <ShieldAlert className="size-5" />,
  Premium: <ShieldCheck className="size-5" />,
  Beta: <FileWarning className="size-5" />,
  Settings: <Settings className="size-5" />,
};

// Add this after the existing category icons definition
const categoryGroups = {
  Main: {
    "Executors Detections": [
      "E1",
      "E2",
      "E3",
      "E4",
      "E5",
      "E6",
    ],
    "Client Detections": [
      "AntiLuaMenu",
      "AntiTeleport",
      "AntiNoClip",
      "AntiFreeCam",
      "AntiSpeedHack",
      "AntiNoRagdoll",
      "AntiSpectate",
      "AntiInvisible",
      "AntiSuperJump",
      "AntiInfiniteStamina",
      "AntiPedModelChange",
      "AntiNightVisions",
      "AntiAFKBypass",
      "AntiInputBox",
    ],
    "Health Detections": [
      "AntiInfiniteRefill",
      "AntiOverrideHealthStats",
      "AntiInvincible",
      "AntiNoCombatDamages",
      "ClientReviveEvent",
    ],
    "Events Detections": [
      "AntiTriggerServerEventAI",
      "AntiTriggerClientEventAI",
      "AntiTriggerExportAI",
      "IgnoredEvents",
    ],
    "Misc Detections": [
      "AntiResourceStop",
      "AntiResourceInjection",
      "AntiClearTasks",
      "AntiDevTools",
      "AntiSpoofer",
      "AntiVoiceExploits",
    ],
  },
  Weapons: {
    "Weapons Detections": [
      "AntiWeaponSpawner",
      "AddonWeapons",
      "AntiGiveWeapons",
      "AntiRemoveWeapons",
      "AntiSpoofedBullets",
      "AntiKill",
      "EnableWeaponsBlackList",
      "BlackListedWeapons",
    ],
    "Weapons Cheats": [
      "AntiAimBot",
      "AntiWeaponComponentModifier",
      "AntiWeaponDamagesModifier",
      "AntiAmmoCheating",
      "AntiInfiniteAmmo",
      "AntiNoReload",
      "AntiExplosiveBullets",
      "AntiSuperPunch",
      "AntiHitboxModifier",
      "AntiNoRecoil",
    ],
    Projectiles: [
      "EnableProjectilesWhiteList",
      "WhiteListedProjectiles",
      "EnableProjectilesLimiter",
      "ProjectilesLimitIn5Seconds",
      "LogProjectileSpawnsToConsole",
    ],
  },
  Entities: {
    "Vehicles Detections": [
      "EnableVehiclesAI",
      "EnableVehiclesAIv2",
      "AntiSpawnIsolatedVehicles",
      "EnableVehiclesBlackList",
      "BlackListedVehicles",
      "EnableVehiclesWhiteList",
      "WhiteListedVehicles",
      "EnableVehiclesLimiter",
      "VehiclesLimitIn5Seconds",
      "LogVehicleSpawnsToConsole",
      "AntiThrowVehicles",
      "AntiDeleteVehicles",
      "AntiTeleportInVehicle",
      "AntiSpeedModifier",
      "AntiHandlingModifier",
      "AntiVehiclePlateChanger",
      "NoCarKill",
      "DeleteVehicleOnDestroy",
    ],
    "Peds Detections": [
      "DisableNPCPopulation",
      "EnablePedsAI",
      "EnablePedsAIv2",
      "EnablePedsBlackList",
      "BlackListedPeds",
      "EnablePedsWhiteList",
      "WhiteListedPeds",
      "EnablePedsLimiter",
      "PedsLimitIn5Seconds",
      "LogPedSpawnsToConsole",
    ],
    "Objects Detections": [
      "EnableObjectsAI",
      "EnableObjectsBlackList",
      "BlackListedObjects",
      "EnableObjectsWhiteList",
      "WhiteListedObjects",
      "EnableObjectsLimiter",
      "ObjectsLimitIn5Seconds",
      "AntiPickupSpawn",
      "LogObjectSpawnsToConsole",
    ],
  },
  Explosions: {
    "Explosions Detections": [
      "EnableExplosionsAI",
      "EnableExplosionsBlackList",
      "BlackListedExplosions",
      "DetectInvisibleExplosions",
      "DetectInaudibleExplosions",
      "EnableExplosionsLimiter",
      "ExplosionsLimitIn5Seconds",
      "CancelAllExplosions",
      "CancelAllFires",
      "LogExplosionSpawnsToConsole",
    ],
    "Particles Detections": [
      "EnableParticlesAI",
      "EnableParticlesWhiteList",
      "WhiteListedParticles",
      "DetectParticlesAttachedToEntity",
      "MaxParticleScale",
      "LogParticleSpawnsToConsole",
    ],
  },
  Premium: {
    "Premium Features": [
      "AntiRequestControl",
      "AntiSoundExploits",
      "AntiRagdollExploit",
      "AntiBombVehicles",
    ],
  },
  Beta: {
    "Experimental Features": [
      "AntiUnisolatedInjection",
      "IgnoredExecutionPatterns",
      "AntiMagneto",
      "AntiAttachVehicles",
      "AntiSilentAim",
    ],
  },
  Settings: {
    "Discord Integration": [
      "EnableDiscordLogs",
      "ShowIpAddress",
      "MainWebhook",
      "EntitiesWebhook",
      "ExplosionsWebhook",
      "WeaponsWebhook",
      "UnbansWebhook",
      "ConnectionsWebhook",
      "CommunityLogsWebhook",
      "GlobalBanWebhook",
      "ScreenshotsWebhook",
    ],
    "Ban System": [
      "EnableBans",
      "EnableScreenShots",
      "EnableGameplayRecord",
      "BanDuration",
      "BanIpAddress",
      "BanMessage",
      "LogUnbansToDiscord",
    ],
    "Connection Management": [
      "LogConnectionsToDiscord",
      "LogConnectionsToConsole",
      "LogOnConnect",
      "LogOnDisconnect",
      "MaxThreatScore",
      "AntiVPN",
      "AntiXSSInjections",
      "AntiConnectionDupe",
      "RequireDiscord",
      "RequireAlphanumericName",
    ],
    "System Settings": [
      "EnableAntiBackdoors",
      "StopServerWhenDetected",
      "CommandPrefix",
      "IgnoredScripts",
    ],
  },
};

// Also add subcategory descriptions
const getSubcategoryDescription = (subcategory: string) => {
  switch (subcategory) {
    case "Executors Detections":
      return "Detect and block cheat executors and exploits";
    case "Client Detections":
      return "Prevent client-side cheats and exploits";
    case "Health Detections":
      return "Block health and damage manipulation";
    case "Events Detections":
      return "Protect against event triggering exploits";
    case "Aiming Detections":
      return "Counter aimbot and aim assistance cheats";
    case "Weapons Management":
      return "Control weapon spawning and management";
    case "Weapons Properties":
      return "Prevent weapon property modifications";
    case "Projectiles Controls":
      return "Manage projectile usage and limitations";
    case "Vehicles Controls":
      return "Control vehicle spawning and management";
    case "Vehicles Properties":
      return "Prevent vehicle property modifications";
    case "Peds Controls":
      return "Manage NPC spawning and limitations";
    case "Objects Controls":
      return "Control object spawning and management";
    case "Explosions Controls":
      return "Manage explosion detection and prevention";
    case "Particles Controls":
      return "Control particle effects and limitations";
    case "Premium Features":
      return "Advanced protection features for subscribers";
    case "Experimental Features":
      return "Beta features under development";
    case "Discord Integration":
      return "Connect your server to Discord for notifications";
    case "Ban System":
      return "Configure ban settings and duration";
    case "Connection Management":
      return "Control player connection requirements";
    case "System Settings":
      return "General system configuration options";
    case "Exceptions":
      return "Define exceptions to protection rules";
    default:
      return "";
  }
};

// Add this new MasonryGrid component right before the ServerConfiguration component
// This creates a proper masonry layout without requiring external libraries

interface MasonryGridProps {
  children: React.ReactNode[];
  columns: number;
  gap: number;
}

const MasonryGrid = React.memo(function MasonryGrid({
  children,
  columns = 3,
  gap = 16,
}: MasonryGridProps) {
  const columnWrapperRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
  const [gridItems, setGridItems] = useState<React.ReactNode[][]>([]);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // Reset refs when children change
  useEffect(() => {
    itemsRef.current = Array(children.length).fill(null);
  }, [children.length]);

  // Update window width on resize
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dynamically adjust columns based on screen width
  const getResponsiveColumns = useCallback(() => {
    // Only use this logic on client side
    if (typeof window === "undefined") return columns;

    // Use fewer columns on smaller screens
    if (windowWidth < 640) return 1; // Mobile
    if (windowWidth < 768) return Math.min(2, columns); // Small tablets
    if (windowWidth < 1024) return Math.min(2, columns); // Tablets
    return columns; // Desktop
  }, [columns, windowWidth]);

  // Function to distribute items among columns more intelligently
  const distributeItems = useCallback(() => {
    if (!columnWrapperRef.current) return;

    const responsiveColumns = getResponsiveColumns();

    // Initialize arrays for each column
    const columnItems: React.ReactNode[][] = Array.from(
      { length: responsiveColumns },
      () => []
    );

    // Initialize heights for each column
    const columnHeights = Array(responsiveColumns).fill(0);

    // Helper function to get approximate item height
    const getApproxItemHeight = (item: React.ReactNode, index: number) => {
      if (React.isValidElement(item)) {
        const childCount = React.Children.count(item);
        if (childCount > 0) {
          return 100 + childCount * 30;
        }
      }

      return 150 + (index % 3) * 50;
    };

    // Sort items by estimated height (largest first)
    const itemsWithEstimatedHeight = children.map((item, index) => ({
      item,
      index,
      height: getApproxItemHeight(item, index),
    }));

    // Sort by height descending (place largest items first)
    itemsWithEstimatedHeight.sort((a, b) => b.height - a.height);

    // Place each item in the column with the smallest height
    itemsWithEstimatedHeight.forEach(({ item, height, index }) => {
      // Find column with smallest height
      const smallestHeightColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights)
      );

      // Add item to that column
      columnItems[smallestHeightColumnIndex]?.push(
        <div
          key={index}
          ref={(el) => {
            itemsRef.current[index] = el;
          }}
          className="w-full"
        >
          {item}
        </div>
      );

      // Update that column's height
      columnHeights[smallestHeightColumnIndex] += height + gap;
    });

    setGridItems(columnItems);
  }, [children, gap, getResponsiveColumns]);

  // Distribute items on mount and when dependencies change
  useEffect(() => {
    distributeItems();

    // Handle window resize
    const handleResize = () => {
      distributeItems();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [children, distributeItems, windowWidth]);

  return (
    <div
      ref={columnWrapperRef}
      className="grid w-full"
      style={{
        gridTemplateColumns: `repeat(${getResponsiveColumns()}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {gridItems.map((columnItems, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {columnItems}
        </div>
      ))}
    </div>
  );
});

export default function ServerConfiguration() {
  const t = useScopedI18n("server_configuration");
  const params = useParams();
  const serverId = params.serverId as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // State for managing configuration
  const [activeTab, setActiveTab] = useState("Main");
  const [searchQuery, setSearchQuery] = useState("");
  const [config, setConfig] = useState<VexonACConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<VexonACConfig | null>(
    null
  );
  const [pendingChanges, setPendingChanges] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareForm, setShareForm] = useState<{
    name: string;
    description: string;
    tags: (typeof SHARE_TAGS)[number][];
    isPublic: boolean;
  }>({
    name: "",
    description: "",
    tags: [],
    isPublic: false,
  });

  // Ensure pending changes starts as false on component mount
  useEffect(() => {
    setPendingChanges(false);
  }, []);

  // Use a separate transient state for current editing
  // This prevents costly deep cloning on every keystroke
  const [editingConfig, setEditingConfig] = useState<
    Record<string, Record<string, any>>
  >({});
  const debouncedUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Fetch server data
  const { data: server, isLoading: isServerLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
      staleTime: 30000,
    })
  );

  // Check basic server membership first
  const isServerMember = useMemo(() => {
    if (!server) return false;
    if (server.isOwner) return true;
    if (server.permissions && Array.isArray(server.permissions)) {
      const permissions = server.permissions.map((p) =>
        String(p)
      ) as Permission[];
      return hasPermission(permissions, "ANY");
    }
    return false;
  }, [server, serverId]);

  // Check if user has permission to edit config
  const isAllowed = useMemo(() => {
    if (!server) return false;

    // Check if user is owner or has required permission
    if (server.isOwner) return true;

    // Check server permissions
    if (server.permissions && Array.isArray(server.permissions)) {
      const permissions = server.permissions.map((p) =>
        String(p)
      ) as Permission[];
      return hasPermission(permissions, "CONFIGURATION");
    }

    return false;
  }, [server, serverId]);

  // Fetch config data (this would be implemented in the backend later)
  const { data: serverConfig, isLoading: isConfigLoading } = useQuery(
    trpc.servers.getConfig.queryOptions(serverId, {
      enabled: !!server && isAllowed,
    })
  );

  // Mock API mutations (would be implemented in the backend later)
  const saveConfigMutation = useMutation(
    trpc.servers.setConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Configuration saved successfully");
        setPendingChanges(false);
        // Update original config to current config to reset the baseline
        if (config) {
          setOriginalConfig(JSON.parse(JSON.stringify(config)));
        }
        queryClient.invalidateQueries({
          queryKey: ["serverConfig", serverId],
        });
      },
      onError: () => {
        toast.error("Failed to save configuration");
      },
    })
  );

  const shareConfigMutation = useMutation(
    trpc.servers.shareConfig.mutationOptions({
      onSuccess: (result) => {
        // Auto-copy to clipboard
        navigator.clipboard.writeText(result.id);

        toast.success("Configuration shared successfully", {
          description: `Share ID copied to clipboard: ${result.id}`,
        });

        // Reset form and close dialog
        setShareForm({
          name: "",
          description: "",
          tags: [],
          isPublic: false,
        });
        setIsShareDialogOpen(false);
      },
      onError: (error: any) => {
        toast.error("Failed to share configuration", {
          description: error.message,
        });
      },
    })
  );

  const importConfigMutation = useMutation(
    trpc.servers.importConfig.mutationOptions({
      onSuccess: (result) => {
        setConfig(result.configuration);
        setPendingChanges(true);
        setIsImportDialogOpen(false);
        toast.success("Configuration loaded successfully", {
          description: `Loaded from: ${
            result.importedFrom.name || result.importedFrom.id
          }. Click "Save Changes" to apply.`,
        });
      },
      onError: (error: any) => {
        toast.error("Failed to import configuration", {
          description: error.message,
        });
      },
    })
  );

  // Track if config has been initialized to prevent false positives
  const [isConfigInitialized, setIsConfigInitialized] = useState(false);

  // Normalize config values to handle server data inconsistencies
  const normalizeConfig = useCallback((config: any) => {
    if (!config) return config;

    const normalized = JSON.parse(JSON.stringify(config));

    // Normalize each category
    for (const category in normalized) {
      if (normalized.hasOwnProperty(category)) {
        const categoryConfig = normalized[category];
        for (const key in categoryConfig) {
          if (
            categoryConfig.hasOwnProperty(key) &&
            categoryConfig[key]?.value !== undefined
          ) {
            let value = categoryConfig[key].value;

            // Handle different value types properly
            if (value === null || value === undefined) {
              // Check the config type to determine default value
              const configItem = categoryConfig[key];
              if (
                configItem.type === "array" ||
                Array.isArray(configItem.defaultValue)
              ) {
                value = [];
              } else {
                value = "";
              }
            } else if (Array.isArray(value)) {
              // Keep arrays as arrays, preserving original data types
              // Only trim strings, preserve numbers and other types
              value = value.map((item) => {
                if (typeof item === "string") {
                  return item.trim();
                }
                return item; // Keep numbers, booleans, etc. as their original types
              });
            } else if (typeof value === "string") {
              // Only trim strings, don't convert other types
              value = value.trim();
            }
            // For other types (boolean, number), keep as is

            categoryConfig[key].value = value;
          }
        }
      }
    }

    return normalized;
  }, []);

  // Initialize config from server data
  useEffect(() => {
    if (serverConfig) {
      // Extract the actual configuration data if it's nested
      const actualConfig = (serverConfig as any).configuration || serverConfig;

      console.log("Raw server config:", { actualConfig });

      // Normalize the config to handle type inconsistencies
      const normalizedConfig = normalizeConfig(actualConfig);

      console.log("Normalized config:", { normalizedConfig });

      // Create identical copies to ensure no reference issues
      const configCopy1 = JSON.parse(JSON.stringify(normalizedConfig));
      const configCopy2 = JSON.parse(JSON.stringify(normalizedConfig));

      // Reset states first
      setIsConfigInitialized(false);
      setPendingChanges(false);

      // Set both configs to identical copies
      setConfig(configCopy1 as VexonACConfig);
      setOriginalConfig(configCopy2);

      // Use setTimeout to ensure state updates have completed
      setTimeout(() => {
        setPendingChanges(false);
        setIsConfigInitialized(true);
        console.log("Config initialization completed");
      }, 50);
    }
  }, [serverConfig, normalizeConfig]);

  // Update pendingChanges flag when config changes (highly optimized)
  const pendingChangesRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize values for comparison to handle type mismatches
  const normalizeValue = useCallback((value: any) => {
    // Handle null, undefined consistently
    if (value === null || value === undefined) {
      return "";
    }

    // Handle arrays - sort them to ensure consistent comparison
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          // Preserve original types in comparison
          if (typeof item === "string") {
            return item.trim();
          }
          return item; // Keep numbers, booleans, etc. as original types
        })
        .filter((item) => item !== null && item !== undefined && item !== "") // Remove empty/null items
        .sort()
        .join(",");
    }

    // Handle empty strings
    if (value === "") {
      return "";
    }

    // Convert to string and trim for other types
    return String(value).trim();
  }, []);

  // Fast shallow comparison function to avoid expensive JSON.stringify
  const hasConfigChanges = useCallback(
    (current: VexonACConfig, original: VexonACConfig) => {
      // Skip comparison if not properly initialized
      if (!isConfigInitialized) return false;

      // Additional safety check to ensure both configs are valid
      if (!current || !original) return false;

      const differences: string[] = [];

      for (const category in current) {
        if (current.hasOwnProperty(category)) {
          const currentCategory = (current as any)[category];
          const originalCategory = (original as any)[category];

          if (!originalCategory) {
            differences.push(`Missing category in original: ${category}`);
            continue;
          }

          for (const key in currentCategory) {
            if (currentCategory.hasOwnProperty(key)) {
              const currentValue = normalizeValue(currentCategory[key]?.value);
              const originalValue = normalizeValue(
                originalCategory[key]?.value
              );

              if (currentValue !== originalValue) {
                differences.push(
                  `${category}.${key}: "${originalValue}" -> "${currentValue}" (types: ${typeof originalCategory[
                    key
                  ]?.value} -> ${typeof currentCategory[key]?.value})`
                );
              }
            }
          }
        }
      }

      // Debug logging to see what differences are found
      if (differences.length > 0) {
        console.log("Config differences found:", differences);
      }

      return differences.length > 0;
    },
    [isConfigInitialized, normalizeValue]
  );

  useEffect(() => {
    // Only run comparison if both configs exist and initialization is complete
    if (config && originalConfig && isConfigInitialized) {
      // Debounce the optimized comparison
      if (pendingChangesRef.current) {
        clearTimeout(pendingChangesRef.current);
      }

      pendingChangesRef.current = setTimeout(() => {
        const hasChanges = hasConfigChanges(config, originalConfig);
        console.log("Running change detection:", {
          hasChanges,
          isConfigInitialized,
          configExists: !!config,
          originalConfigExists: !!originalConfig,
        });
        setPendingChanges(hasChanges);
      }, 300); // Longer timeout to avoid initialization race conditions
    } else {
      // If not properly initialized, ensure pending changes is false
      setPendingChanges(false);
    }

    return () => {
      if (pendingChangesRef.current) {
        clearTimeout(pendingChangesRef.current);
      }
    };
  }, [config, originalConfig, hasConfigChanges, isConfigInitialized]);

  // Initialize editing config (optimized)
  useEffect(() => {
    if (config && isConfigInitialized) {
      // Only initialize editing config after main config is properly initialized
      const flatConfig: Record<string, Record<string, any>> = {};

      // Use for...in for better performance on large objects
      for (const category in config) {
        if (config.hasOwnProperty(category)) {
          const categoryConfig = (config as any)[category];
          flatConfig[category] = {};

          for (const key in categoryConfig) {
            if (categoryConfig.hasOwnProperty(key)) {
              flatConfig[category][key] = categoryConfig[key].value;
            }
          }
        }
      }

      setEditingConfig(flatConfig);
    }
  }, [config, isConfigInitialized]);

  // Handle config value changes - optimized for performance
  const handleConfigChange = useCallback(
    (category: string, key: string, value: any) => {
      // Update the editing state immediately (fast)
      setEditingConfig((prev) => ({
        ...prev,
        [category]: {
          ...(prev[category] || {}),
          [key]: value,
        },
      }));

      // Clear previous timeout if it exists
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }

      // Optimized debounced update with throttling
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      const delay = timeSinceLastUpdate < 50 ? 100 : 50; // Adaptive delay

      debouncedUpdateRef.current = setTimeout(() => {
        lastUpdateTimeRef.current = Date.now();

        setConfig((prevConfig) => {
          if (!prevConfig) return null;

          // Shallow clone only the affected parts
          const newConfig = { ...prevConfig };
          const prevCategoryConfig = newConfig[
            category as keyof VexonACConfig
          ] as any;

          if (prevCategoryConfig && key in prevCategoryConfig) {
            // Clone only the category and the specific item
            const categoryConfig = { ...prevCategoryConfig };
            categoryConfig[key] = {
              ...categoryConfig[key],
              value: value,
            };

            // Update only the affected category
            (newConfig as any)[category] = categoryConfig;
          }

          return newConfig;
        });
      }, delay);
    },
    []
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
      if (pendingChangesRef.current) {
        clearTimeout(pendingChangesRef.current);
      }
    };
  }, []);

  // Get the current value for an option - from editing state if available (memoized)
  const getCurrentValue = useCallback(
    (category: string, key: string, defaultValue: any) => {
      const categoryEdits = editingConfig[category];
      return categoryEdits && categoryEdits[key] !== undefined
        ? categoryEdits[key]
        : defaultValue;
    },
    [editingConfig]
  );

  // Filter config options based on search query (optimized)
  const filteredOptions = useMemo(() => {
    if (!config || !searchQuery.trim()) {
      return null;
    }

    const results: Record<string, any> = {};
    const lowerQuery = searchQuery.toLowerCase();

    // Use for...in for better performance
    for (const category of categories) {
      const categoryItems = (config as any)[category];
      if (!categoryItems) continue;

      const matchingItems: Record<string, any> = {};
      let hasMatches = false;

      for (const key in categoryItems) {
        if (categoryItems.hasOwnProperty(key)) {
          const item = categoryItems[key];
          if (
            item.label?.toLowerCase().includes(lowerQuery) ||
            item.tooltip?.toLowerCase().includes(lowerQuery)
          ) {
            matchingItems[key] = item;
            hasMatches = true;
          }
        }
      }

      if (hasMatches) {
        results[category] = matchingItems;
      }
    }

    return Object.keys(results).length > 0 ? results : null;
  }, [config, searchQuery]);

  // Filter category groups based on search query
  const getFilteredCategoryGroups = useCallback(
    (category: string) => {
      const groups =
        categoryGroups[category as keyof typeof categoryGroups] || {};

      // If no search query, show all groups
      if (!searchQuery.trim()) {
        return groups;
      }

      // If search query but no filtered results, show nothing
      if (!filteredOptions) {
        return {};
      }

      const filteredGroups: Record<string, string[]> = {};
      const categoryFilteredOptions = filteredOptions[category];

      // If no matches for this category, show nothing
      if (!categoryFilteredOptions) {
        return {};
      }

      // Filter each group to only include keys that match the search
      Object.entries(groups).forEach(([groupName, keys]) => {
        const matchingKeys = keys.filter(
          (key) => categoryFilteredOptions[key] !== undefined
        );

        if (matchingKeys.length > 0) {
          filteredGroups[groupName] = matchingKeys;
        }
      });

      return filteredGroups;
    },
    [searchQuery, filteredOptions]
  );

  // Save changes (optimized to avoid extractValues)
  const handleSaveChanges = useCallback(() => {
    if (!config) return;

    // Extract values efficiently without the expensive extractValues function
    const configValues: Record<string, any> = {};

    for (const category in config) {
      if (config.hasOwnProperty(category)) {
        const categoryConfig = (config as any)[category];
        configValues[category] = {};

        for (const key in categoryConfig) {
          if (categoryConfig.hasOwnProperty(key)) {
            configValues[category][key] = categoryConfig[key].value;
          }
        }
      }
    }

    saveConfigMutation.mutate({
      serverId,
      configuration: configValues,
    });
  }, [config, serverId, saveConfigMutation]);

  // Reset to original config
  const handleCancelChanges = () => {
    if (originalConfig) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
      // Reset pending changes immediately and ensure it stays false
      setPendingChanges(false);

      // Brief timeout to ensure state updates are complete
      setTimeout(() => {
        setPendingChanges(false);
      }, 50);
    }
  };

  // Reset to default config
  const handleResetToDefault = () => {
    setConfig(JSON.parse(JSON.stringify(defaultConfig)));
    setPendingChanges(true);
  };

  // Share config
  const handleShareConfig = () => {
    if (!config) return;

    shareConfigMutation.mutate({
      serverId,
      name: shareForm.name || undefined,
      description: shareForm.description || undefined,
      tags: shareForm.tags,
      isPublic: shareForm.isPublic,
    });
  };

  // Import config
  const handleImportConfig = () => {
    if (!importValue.trim()) {
      toast.error("Please enter a configuration ID");
      return;
    }
    importConfigMutation.mutate({
      serverId,
      id: importValue.trim(),
    });
  };

  // Optimized ConfigOptionCard rendering with minimal re-renders
  const renderConfigOption = useCallback(
    (category: string, key: string, configItem: any) => {
      if (!configItem) return null;

      // Get current value once and avoid object recreation
      const currentValue = getCurrentValue(category, key, configItem.value);

      // Only create new object if value actually changed
      const option =
        currentValue !== configItem.value
          ? { ...configItem, value: currentValue }
          : configItem;

      return (
        <ConfigOptionCard
          key={key}
          category={category}
          optionKey={key}
          option={option}
          onChange={(value) => handleConfigChange(category, key, value)}
          disabled={saveConfigMutation.isPending}
          serverId={serverId}
        />
      );
    },
    [getCurrentValue, handleConfigChange, saveConfigMutation.isPending]
  );

  // Render loading state
  if (isServerLoading || isConfigLoading) {
    return (
      <ContentLayout
        title={t("configuration")}
        breadcrumb={{
          title: t("dashboard"),
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary mb-2"></div>
          <p className="text-sm text-muted-foreground">
            {t("loading_configuration")}
          </p>
        </div>
      </ContentLayout>
    );
  }

  // Render server membership denied state
  if (!isServerMember) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || t("my_server"))}
        breadcrumb={{
          title: t("dashboard"),
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center">
          <ShieldAlert className="h-12 w-12 sm:h-16 sm:w-16 text-destructive/60 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold">Access Denied</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-md">
            You don't have permission to access this server. Contact the server
            owner to get added as a server member.
          </p>
        </div>
      </ContentLayout>
    );
  }

  // Render access denied state
  if (!isAllowed) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || t("my_server"))}
        breadcrumb={{
          title: t("dashboard"),
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center">
          <Ban className="h-12 w-12 sm:h-16 sm:w-16 text-destructive/60 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold">
            {t("access_denied")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-md">
            {t("access_denied_description")}
          </p>
        </div>
      </ContentLayout>
    );
  }

  // Render main configuration UI
  return (
    <ContentLayout
      title={formatServerName(server?.serverName || t("my_server"))}
      breadcrumb={{
        title: t("dashboard"),
        url: `/dashboard/server/${serverId}`,
      }}
    >
      <div className="grid gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {t("configuration")}
            </h1>
            <p className="text-muted-foreground">
              {t("configuration_description")}
            </p>
          </div>
        </div>
        {pendingChanges && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-center gap-2">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
              {t("unsaved_changes")}
            </p>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={saveConfigMutation.isPending}
              className="whitespace-nowrap"
            >
              {saveConfigMutation.isPending ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Check className="mr-2 h-3 w-3" />
              )}
              Save
            </Button>
          </div>
        )}
        {/* Action Bar */}
        <Card>
          <CardContent className="px-3 sm:px-4">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-between">
                <div className="flex flex-wrap gap-2">
                  {/* Import Config Button */}
                  <AlertDialog
                    open={isImportDialogOpen}
                    onOpenChange={setIsImportDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap w-full sm:w-auto"
                      >
                        <Import className="mr-2 h-4 w-4" /> {t("import")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("import_config")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("import_config_description")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex items-center gap-2 my-4">
                        <Input
                          value={importValue}
                          onChange={(e) => setImportValue(e.target.value)}
                          placeholder={t("import_id_placeholder")}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            handleImportConfig();
                          }}
                          disabled={importConfigMutation.isPending}
                        >
                          {importConfigMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {t("import")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Share Config Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShareDialogOpen(true)}
                    className="whitespace-nowrap w-full sm:w-auto"
                  >
                    <Share2 className="mr-2 h-4 w-4" /> {t("share")}
                  </Button>

                  {/* Reset to Default Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap w-full sm:w-auto"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> {t("reset")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("reset_config")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("reset_config_description")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handleResetToDefault();
                          }}
                        >
                          {t("reset")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  {/* Cancel Changes Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelChanges}
                    disabled={!pendingChanges}
                    className="whitespace-nowrap w-full sm:w-auto"
                  >
                    <X className="mr-2 h-4 w-4" /> {t("cancel_changes")}
                  </Button>

                  {/* Save Changes Button */}
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={!pendingChanges || saveConfigMutation.isPending}
                    className="whitespace-nowrap w-full sm:w-auto"
                  >
                    {saveConfigMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {t("save_changes")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Content */}
        {config && (
          <>
            {/* Search Results View - Shows when searching */}
            {searchQuery.trim() && filteredOptions && (
              <div className="space-y-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>
                    Search results for "{searchQuery}" - Found{" "}
                    {Object.values(filteredOptions).reduce(
                      (total, categoryOptions) =>
                        total + Object.keys(categoryOptions).length,
                      0
                    )}{" "}
                    options
                  </span>
                </div>

                {/* Group search results by category for better visual separation */}
                {Object.entries(filteredOptions).map(
                  ([category, categoryOptions]) => {
                    const groups =
                      categoryGroups[category as keyof typeof categoryGroups] ||
                      {};
                    const filteredGroups: Record<string, string[]> = {};

                    // Filter groups to only include keys that match the search
                    Object.entries(groups).forEach(([groupName, keys]) => {
                      const matchingKeys = keys.filter(
                        (key) => categoryOptions[key] !== undefined
                      );
                      if (matchingKeys.length > 0) {
                        filteredGroups[groupName] = matchingKeys;
                      }
                    });

                    // Skip if no matching groups
                    if (Object.keys(filteredGroups).length === 0) return null;

                    return (
                      <div key={category} className="space-y-6">
                        {/* Category Header */}
                        <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                          {categoryIcons[category]}
                          <h2 className="text-xl font-semibold">{category}</h2>
                          <Badge variant="secondary" className="text-xs">
                            {Object.values(filteredGroups).reduce(
                              (total, keys) => total + keys.length,
                              0
                            )}{" "}
                            matches
                          </Badge>
                        </div>

                        {/* Desktop - 3 columns */}
                        <div className="hidden xl:block">
                          <MasonryGrid columns={3} gap={16}>
                            {Object.entries(filteredGroups).map(
                              ([groupName, keys]) => (
                                <Card key={`${category}-${groupName}`}>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      {categoryIcons[category]}
                                      <span>{groupName}</span>
                                    </CardTitle>
                                    <CardDescription>
                                      {getSubcategoryDescription(groupName)}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-0 border rounded-md overflow-hidden">
                                      {keys.map((key) => {
                                        const configItem = (
                                          config[
                                            category as keyof VexonACConfig
                                          ] as any
                                        )?.[key];
                                        if (!configItem) return null;
                                        return renderConfigOption(
                                          category,
                                          key,
                                          configItem
                                        );
                                      })}
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            )}
                          </MasonryGrid>
                        </div>

                        {/* Tablet - 2 columns */}
                        <div className="hidden md:block xl:hidden">
                          <MasonryGrid columns={2} gap={16}>
                            {Object.entries(filteredGroups).map(
                              ([groupName, keys]) => (
                                <Card key={`${category}-${groupName}`}>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      {categoryIcons[category]}
                                      <span>{groupName}</span>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">
                                      {getSubcategoryDescription(groupName)}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-0 border rounded-md overflow-hidden">
                                      {keys.map((key) => {
                                        const configItem = (
                                          config[
                                            category as keyof VexonACConfig
                                          ] as any
                                        )?.[key];
                                        if (!configItem) return null;
                                        return renderConfigOption(
                                          category,
                                          key,
                                          configItem
                                        );
                                      })}
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            )}
                          </MasonryGrid>
                        </div>

                        {/* Mobile - 1 column */}
                        <div className="block md:hidden">
                          <div className="flex flex-col gap-4">
                            {Object.entries(filteredGroups).map(
                              ([groupName, keys]) => (
                                <Card key={`${category}-${groupName}`}>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      {categoryIcons[category]}
                                      <span className="text-base sm:text-lg">
                                        {groupName}
                                      </span>
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm line-clamp-2">
                                      {getSubcategoryDescription(groupName)}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="px-4 sm:px-6">
                                    <div className="space-y-0 border rounded-md overflow-hidden">
                                      {keys.map((key) => {
                                        const configItem = (
                                          config[
                                            category as keyof VexonACConfig
                                          ] as any
                                        )?.[key];
                                        if (!configItem) return null;
                                        return renderConfigOption(
                                          category,
                                          key,
                                          configItem
                                        );
                                      })}
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* No Search Results */}
            {searchQuery.trim() && !filteredOptions && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground/60 mb-4" />
                <h3 className="text-lg font-medium">No results found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No configuration options match "{searchQuery}". Try a
                  different search term.
                </p>
              </div>
            )}

            {/* Normal Tabs View - Shows when not searching */}
            {!searchQuery.trim() && (
              <Tabs
                defaultValue="Main"
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-2"
              >
                <ScrollArea className="w-full">
                  <TabsList className="inline-flex h-auto p-1 w-auto min-w-full">
                    {categories.map((category) => (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {categoryIcons[category]}
                        <span className="hidden sm:inline">{category}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </ScrollArea>

                {/* Tab Content Sections */}
                {categories.map((category) => (
                  <TabsContent
                    key={category}
                    value={category}
                    className="space-y-6"
                  >
                    {/* Determine column count based on screen size */}
                    <div className="hidden xl:block">
                      <MasonryGrid columns={3} gap={16}>
                        {Object.entries(
                          getFilteredCategoryGroups(category)
                        ).map(([groupName, keys]) => (
                          <Card key={groupName}>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {categoryIcons[category]}
                                <span>{groupName}</span>
                              </CardTitle>
                              <CardDescription>
                                {getSubcategoryDescription(groupName)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-0 border rounded-md overflow-hidden">
                                {keys.map((key) => {
                                  const configItem = (
                                    config[
                                      category as keyof VexonACConfig
                                    ] as any
                                  )?.[key];
                                  if (!configItem) return null;

                                  return renderConfigOption(
                                    category,
                                    key,
                                    configItem
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </MasonryGrid>
                    </div>

                    {/* For medium screens - 2 columns */}
                    <div className="hidden md:block xl:hidden">
                      <MasonryGrid columns={2} gap={16}>
                        {Object.entries(
                          getFilteredCategoryGroups(category)
                        ).map(([groupName, keys]) => (
                          <Card key={groupName}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {categoryIcons[category]}
                                <span>{groupName}</span>
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {getSubcategoryDescription(groupName)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-0 border rounded-md overflow-hidden">
                                {keys.map((key) => {
                                  const configItem = (
                                    config[
                                      category as keyof VexonACConfig
                                    ] as any
                                  )?.[key];
                                  if (!configItem) return null;

                                  return renderConfigOption(
                                    category,
                                    key,
                                    configItem
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </MasonryGrid>
                    </div>

                    {/* For small screens - 1 column */}
                    <div className="block md:hidden">
                      <div className="flex flex-col gap-4">
                        {Object.entries(
                          getFilteredCategoryGroups(category)
                        ).map(([groupName, keys]) => (
                          <Card key={groupName}>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {categoryIcons[category]}
                                <span className="text-base sm:text-lg">
                                  {groupName}
                                </span>
                              </CardTitle>
                              <CardDescription className="text-xs sm:text-sm line-clamp-2">
                                {getSubcategoryDescription(groupName)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6">
                              <div className="space-y-0 border rounded-md overflow-hidden">
                                {keys.map((key) => {
                                  const configItem = (
                                    config[
                                      category as keyof VexonACConfig
                                    ] as any
                                  )?.[key];
                                  if (!configItem) return null;

                                  return renderConfigOption(
                                    category,
                                    key,
                                    configItem
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </>
        )}
      </div>

      {/* Share Configuration Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("share_config")}</DialogTitle>
            <DialogDescription>
              {t("share_dialog_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Configuration Name */}
            <div className="space-y-2">
              <Label htmlFor="share-name">{t("configuration_name")}</Label>
              <Input
                id="share-name"
                placeholder={t("configuration_name_placeholder")}
                value={shareForm.name}
                onChange={(e) =>
                  setShareForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="share-description">
                {t("description_optional")}
              </Label>
              <Textarea
                id="share-description"
                placeholder={t("description_placeholder")}
                value={shareForm.description}
                onChange={(e) =>
                  setShareForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>{t("tags_max_5")}</Label>
              <div className="flex flex-wrap gap-2">
                {SHARE_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={
                      shareForm.tags.includes(tag) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      setShareForm((prev) => {
                        const isSelected = prev.tags.includes(tag);
                        if (isSelected) {
                          return {
                            ...prev,
                            tags: prev.tags.filter((t) => t !== tag),
                          };
                        } else if (prev.tags.length < 5) {
                          return {
                            ...prev,
                            tags: [...prev.tags, tag],
                          };
                        }
                        return prev;
                      });
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("tags_selected", { count: shareForm.tags.length })}
              </p>
            </div>

            {/* Public/Private Setting */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="share-public"
                checked={shareForm.isPublic}
                onCheckedChange={(checked) =>
                  setShareForm((prev) => ({
                    ...prev,
                    isPublic: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="share-public" className="font-normal">
                {t("make_public_marketplace")}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsShareDialogOpen(false)}
              disabled={shareConfigMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleShareConfig}
              disabled={shareConfigMutation.isPending}
            >
              {shareConfigMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              {t("share_configuration")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  );
}


