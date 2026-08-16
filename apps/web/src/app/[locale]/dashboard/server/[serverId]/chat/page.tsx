"use client";

import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  AlertCircle,
  MapPin,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMsgTime(date: Date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "MMM d, HH:mm");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isMine,
  onDelete,
  canDelete,
}: {
  message: any;
  isMine: boolean;
  onDelete?: (id: string) => void;
  canDelete: boolean;
}) {
  const [hover, setHover] = useState(false);

  const renderContent = () => {
    if (message.messageType === "player_share") {
      const meta = message.metadata || {};
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <User className="h-3 w-3" />
            <span className="font-semibold">Player Info Shared</span>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Name</span>
              <span className="font-semibold">{meta.playerName || "Unknown"}</span>
            </div>
            {meta.playerLicense && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">License</span>
                <span className="font-mono text-[10px] truncate max-w-[140px]">{meta.playerLicense}</span>
              </div>
            )}
            {meta.serverName && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Server</span>
                <span className="font-semibold">{meta.serverName}</span>
              </div>
            )}
          </div>
          {message.content && (
            <p className="text-sm mt-1">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.messageType === "location_share") {
      const meta = message.metadata || {};
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="font-semibold">Location Shared</span>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-1.5">
            {meta.playerName && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Player</span>
                <span className="font-semibold">{meta.playerName}</span>
              </div>
            )}
            {(meta.x !== undefined && meta.y !== undefined) && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Coords</span>
                <span className="font-mono text-[10px]">
                  {Number(meta.x).toFixed(1)}, {Number(meta.y).toFixed(1)}, {Number(meta.z ?? 0).toFixed(1)}
                </span>
              </div>
            )}
          </div>
          {message.content && (
            <p className="text-sm mt-1">{message.content}</p>
          )}
        </div>
      );
    }

    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>;
  };

  return (
    <div
      className={cn("flex gap-2.5 group items-end", isMine ? "flex-row-reverse" : "flex-row")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar */}
      <Avatar className="h-7 w-7 shrink-0 mb-0.5">
        <AvatarImage src={message.authorAvatar} />
        <AvatarFallback className="text-[10px] bg-white/[0.05]">
          {getInitials(message.authorName || "?")}
        </AvatarFallback>
      </Avatar>

      <div className={cn("max-w-[70%] space-y-1", isMine ? "items-end" : "items-start")}>
        {/* Author + time */}
        <div className={cn("flex items-center gap-2 px-1", isMine ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[11px] font-semibold text-foreground/70">{message.authorName}</span>
          <span className="text-[10px] text-muted-foreground/60">{formatMsgTime(message.createdAt)}</span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 relative",
            isMine
              ? "bg-blue-600/30 border border-blue-500/20 rounded-br-md"
              : "bg-white/[0.04] border border-white/[0.05] rounded-bl-md"
          )}
        >
          {renderContent()}

          {/* Delete button */}
          {canDelete && hover && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className={cn(
                "absolute -top-3 rounded-full bg-background/90 border border-white/[0.08] p-1 hover:bg-red-500/20 hover:border-red-500/30 transition-all",
                isMine ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
              )}
            >
              <X className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSeparator({ date }: { date: Date }) {
  const d = new Date(date);
  const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-white/[0.05]" />
      <span className="text-[11px] text-muted-foreground font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminChatPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: server } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, { enabled: !!session })
  );

  const {
    data: messages,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.chat.getMessages.queryOptions({ serverId, limit: 100 }),
    enabled: !!session,
    refetchInterval: 8000,
  });

  const sendMutation = useMutation(
    trpc.chat.sendMessage.mutationOptions({
      onSuccess: () => {
        setText("");
        queryClient.invalidateQueries({ queryKey: trpc.chat.getMessages.queryKey({ serverId, limit: 100 }) });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to send message");
      },
    })
  );

  const deleteMutation = useMutation(
    trpc.chat.deleteMessage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.chat.getMessages.queryKey({ serverId, limit: 100 }) });
      },
      onError: () => toast.error("Failed to delete message"),
    })
  );

  useEffect(() => {
    if (messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate({ serverId, content, messageType: "text" });
  };

  const handleDelete = (messageId: string) => {
    deleteMutation.mutate({ serverId, messageId });
  };

  // Group messages by date
  const groupedMessages = (messages ?? []).reduce<{ date: Date; messages: any[] }[]>((acc, msg) => {
    const d = new Date(msg.createdAt);
    const last = acc[acc.length - 1];
    if (!last || format(new Date(last.date), "yyyy-MM-dd") !== format(d, "yyyy-MM-dd")) {
      acc.push({ date: d, messages: [msg] });
    } else {
      last.messages.push(msg);
    }
    return acc;
  }, []);

  const myDiscordId = (session as any)?.user?.discordId;

  return (
    <ContentLayout title={<>Admin Chat — {formatServerName(server?.serverName)}</>}>
      <div className="flex flex-col h-[calc(100vh-10rem)] rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Staff Chat</p>
              <p className="text-xs text-muted-foreground">Private channel for server admins</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1 border-white/[0.08]">
              <Shield className="h-3 w-3 text-blue-400" />
              Admin only
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={cn("flex gap-2.5", i % 2 === 0 ? "" : "flex-row-reverse")}>
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24 rounded" />
                    <Skeleton className="h-10 w-48 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : groupedMessages.length > 0 ? (
            groupedMessages.map((group, gi) => (
              <div key={gi}>
                <DateSeparator date={group.date} />
                <div className="space-y-3">
                  {group.messages.map((msg) => {
                    const isMine = msg.authorId === myDiscordId;
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMine={isMine}
                        onDelete={handleDelete}
                        canDelete={isMine}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full py-24 text-center">
              <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No messages yet</h3>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Start the conversation — this chat is only visible to server admins
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-white/[0.06] px-4 py-3 bg-white/[0.01]">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="text-[10px] bg-white/[0.05]">
                {getInitials((session as any)?.user?.username || (session?.user?.name ?? "?"))}
              </AvatarFallback>
            </Avatar>
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message admins…"
              className="flex-1 h-9 bg-white/[0.03] border-white/[0.06] text-sm placeholder:text-muted-foreground/50 focus-visible:ring-blue-500/30"
              maxLength={2000}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 bg-blue-600 hover:bg-blue-700 shrink-0"
              disabled={!text.trim() || sendMutation.isPending}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground/40 mt-1.5 ml-9">
            Press Enter to send · Messages are visible to all server admins
          </p>
        </div>
      </div>
    </ContentLayout>
  );
}
