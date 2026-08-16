"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Loader2, Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Note: Schema validation messages will be handled by the form validation
const banPlayerSchema = z.object({
  playerIdentifier: z
    .string()
    .min(1, "Player identifier is required")
    .max(255, "Player identifier too long"),
  reason: z
    .string()
    .min(1, "Ban reason is required")
    .max(1000, "Ban reason too long (max 1000 characters)"),
  evidenceUrl: z
    .string()
    .url("Must be a valid URL")
    .max(500, "Evidence URL too long")
    .optional()
    .or(z.literal("")),
  banType: z.enum(["permanent", "temporary"]),
  duration: z
    .number()
    .min(1, "Duration must be at least 1 hour")
    .max(8760, "Duration cannot exceed 1 year")
    .optional(),
});

type BanPlayerForm = z.infer<typeof banPlayerSchema>;

interface BanPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBanSuccess: () => void;
  serverId: string;
}

export function BanPlayerDialog({
  open,
  onOpenChange,
  onBanSuccess,
  serverId,
}: BanPlayerDialogProps) {
  const t = useScopedI18n("bans_page");
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowPlayerSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const form = useForm<BanPlayerForm>({
    resolver: zodResolver(banPlayerSchema),
    defaultValues: {
      playerIdentifier: "",
      reason: "",
      evidenceUrl: "",
      banType: "permanent",
      duration: 24,
    },
  });

  // Search for players
  const { data: players, isLoading: playersLoading } = useQuery(
    trpc.servers.getPlayers.queryOptions(
      {
        serverId,
        search: playerSearch,
        limit: 10,
      },
      {
        enabled: playerSearch.length > 2,
      }
    )
  );

  // Ban player mutation
  const banPlayerMutation = useMutation(
    trpc.servers.banPlayer.mutationOptions({
      onSuccess: (data: any) => {
        toast.success(`Successfully banned ${data.playerName}`);
        onBanSuccess();
        form.reset();
        setSelectedPlayer(null);
        setPlayerSearch("");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to ban player");
      },
    })
  );

  const onSubmit = (data: BanPlayerForm) => {
    const expiresAt =
      data.banType === "temporary" && data.duration
        ? new Date(Date.now() + data.duration * 60 * 60 * 1000).toISOString()
        : undefined;

    banPlayerMutation.mutate({
      serverId,
      playerIdentifier: data.playerIdentifier,
      reason: data.reason,
      evidenceUrl: data.evidenceUrl || undefined,
      expiresAt,
    });
  };

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const handlePlayerSelect = (player: any) => {
    setSelectedPlayer(player);
    form.setValue("playerIdentifier", player.playerLicense);
    setShowPlayerSearch(false);
    setPlayerSearch(player.playerName);
  };

  const clearSelection = () => {
    setSelectedPlayer(null);
    setPlayerSearch("");
    form.setValue("playerIdentifier", "");
  };

  const handleManualInput = (value: string) => {
    form.setValue("playerIdentifier", value);
    setSelectedPlayer(null);
    // Don't update playerSearch when manually typing
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] overflow-y-auto overflow-x-hidden md:w-[40vw]"
        style={{ maxWidth: "none" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("ban_player")}
          </DialogTitle>
          <DialogDescription>{t("ban_player_description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Player Selection */}
            <div className="space-y-3">
              <FormLabel>{t("player_selection")}</FormLabel>
              <div className="space-y-2">
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t("search_player_placeholder")}
                      value={playerSearch}
                      onChange={(e) => {
                        setPlayerSearch(e.target.value);
                        if (e.target.value.length > 2) {
                          setShowPlayerSearch(true);
                        } else {
                          setShowPlayerSearch(false);
                        }
                      }}
                      onFocus={() => {
                        if (playerSearch.length > 2) {
                          setShowPlayerSearch(true);
                        }
                      }}
                      className="pl-10"
                    />
                  </div>

                  {showPlayerSearch && playerSearch.length > 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-w-full">
                      <Command>
                        <CommandList>
                          {playersLoading && (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                          {!playersLoading && playerSearch.length > 2 && (
                            <>
                              <CommandEmpty>
                                {t("no_players_found")}
                              </CommandEmpty>
                              <CommandGroup>
                                {players?.map((player: any) => {
                                  const allIdentifiers = [
                                    ...(Array.isArray(player.identifiers)
                                      ? player.identifiers
                                      : []),
                                    ...(Array.isArray(player.oldIdentifiers)
                                      ? player.oldIdentifiers
                                      : []),
                                  ];
                                  const matchingIdentifiers =
                                    allIdentifiers.filter(
                                      (id: any) =>
                                        typeof id === "string" &&
                                        id
                                          .toLowerCase()
                                          .includes(
                                            playerSearch.toLowerCase()
                                          ) &&
                                        !id.includes(
                                          player.playerName.toLowerCase()
                                        ) &&
                                        id !== player.playerLicense
                                    );

                                  return (
                                    <CommandItem
                                      key={player.id}
                                      value={player.playerName}
                                      onSelect={() =>
                                        handlePlayerSelect(player)
                                      }
                                      className="overflow-hidden"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 flex-shrink-0 ${
                                          selectedPlayer?.id === player.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        }`}
                                      />
                                      <div className="flex items-center justify-between w-full min-w-0">
                                        <div className="flex-1 min-w-0 pr-2">
                                          <div className="font-medium truncate">
                                            {player.playerName}
                                          </div>
                                          <div className="text-sm text-muted-foreground truncate break-all">
                                            {player.playerLicense}
                                          </div>
                                          {matchingIdentifiers.length > 0 && (
                                            <div className="text-xs text-violet-600 truncate">
                                              {t("matches")}:{" "}
                                              {matchingIdentifiers
                                                .slice(0, 2)
                                                .join(", ")}
                                              {matchingIdentifiers.length > 2 &&
                                                ` +${
                                                  matchingIdentifiers.length - 2
                                                } ${t("more")}`}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right flex-shrink-0 text-xs">
                                          <div className="text-sm whitespace-nowrap">
                                            {t("played")}{" "}
                                            {formatPlayTime(player.playTime)}
                                          </div>
                                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {t("joined")}{" "}
                                            {format(
                                              new Date(player.lastJoin),
                                              "MMM dd"
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>

                {/* Selected Player Display */}
                {selectedPlayer && (
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {selectedPlayer.playerName}
                          </div>
                          <div className="text-sm text-muted-foreground truncate break-all">
                            {selectedPlayer.playerLicense}
                          </div>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0">
                          {formatPlayTime(selectedPlayer.playTime)}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                        className="flex-shrink-0 ml-2"
                      >
                        {t("clear")}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  {t("or")}
                </div>

                <FormField
                  control={form.control}
                  name="playerIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={t("enter_identifier_placeholder")}
                          maxLength={255}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleManualInput(e.target.value);
                          }}
                          className="break-all"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("enter_identifier_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ban Details */}
            <div className="space-y-4">
              {/* Ban templates */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Quick templates</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Cheating — Aimbot",
                    "Cheating — ESP/Wallhack",
                    "Cheating — God Mode",
                    "Cheating — Speed Hack",
                    "Cheating — Money Glitch",
                    "Toxic behaviour / Harassment",
                    "DDOS / Crash attempt",
                    "Exploiting game bugs",
                    "Inappropriate username",
                    "Alt account (ban evasion)",
                  ].map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => form.setValue("reason", template, { shouldValidate: true })}
                      className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-muted transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("ban_reason")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("ban_reason_placeholder")}
                        className="min-h-[60px] resize-none"
                        maxLength={1000}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("ban_reason_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evidenceUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("evidence_url")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("evidence_url_placeholder")}
                        maxLength={500}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("evidence_url_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="banType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("ban_type")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("ban_type")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="permanent">
                            {t("permanent_ban")}
                          </SelectItem>
                          <SelectItem value="temporary">
                            {t("temporary_ban")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("banType") === "temporary" && (
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("ban_duration")} ({t("hours")})
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="8760"
                            placeholder="24"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Selected Player Preview */}
            {selectedPlayer && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">{t("selected_player")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <span className="text-muted-foreground">{t("name")}:</span>{" "}
                    <span className="break-words">
                      {selectedPlayer.playerName}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-muted-foreground">
                      {t("play_time")}:
                    </span>{" "}
                    {formatPlayTime(selectedPlayer.playTime)}
                  </div>
                  <div className="min-w-0 col-span-1 sm:col-span-2">
                    <span className="text-muted-foreground">
                      {t("license")}:
                    </span>{" "}
                    <span className="break-all text-xs">
                      {selectedPlayer.playerLicense}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-muted-foreground">
                      {t("last_join")}:
                    </span>{" "}
                    {format(new Date(selectedPlayer.lastJoin), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={banPlayerMutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={banPlayerMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {banPlayerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("banning")}
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    {t("ban_player")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
