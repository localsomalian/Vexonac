"use client";

import {
  Languages,
  LogOut,
  Monitor,
  Moon,
  MoonStar,
  Sun,
  ChevronUp,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth-client";
import {
  locales,
  useChangeLocale,
  useCurrentLocale,
  useScopedI18n,
} from "@/locales/client";
import { useRouter } from "next/navigation";

export function NavUser({
  user,
}: {
  user: {
    username: string;
    discordId: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const t = useScopedI18n("sidebar");
  const { setTheme } = useTheme();
  const changeLocale = useChangeLocale();
  const currentLocale = useCurrentLocale();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-lg mx-1 hover:bg-white/5 transition-colors"
            >
              <Avatar className="h-7 w-7 rounded border border-border/40 shrink-0">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="rounded text-[10px] bg-primary/10 text-primary font-bold">
                  {user.username?.slice(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-[12px] font-semibold text-foreground">{user.username}</span>
                <span className="truncate text-[10px] text-muted-foreground/70 font-mono">{user.discordId}</span>
              </div>
              <ChevronUp className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded border border-border/60 bg-card"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2">
                <Avatar className="h-7 w-7 rounded border border-border/40">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="rounded text-[10px] bg-primary/10 text-primary font-bold">
                    {user.username?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-[12px] font-semibold">{user.username}</span>
                  <span className="truncate text-[10px] text-muted-foreground font-mono">{user.discordId}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-[13px]">
                <Languages className="mr-2 h-3.5 w-3.5" />
                {t("language")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded border border-border/60 bg-card">
                {locales.map((locale) => (
                  <DropdownMenuItem
                    key={locale.code}
                    onClick={() => changeLocale(locale.code)}
                    className={
                      currentLocale === locale.code
                        ? "bg-primary/10 text-primary text-[13px]"
                        : "text-[13px]"
                    }
                  >
                    <span className="flex-1">{locale.name}</span>
                    {currentLocale === locale.code && (
                      <span className="ml-2 text-[10px] text-primary font-mono">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-[13px]">
                <MoonStar className="mr-2 h-3.5 w-3.5" />
                {t("theme")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded border border-border/60 bg-card">
                <DropdownMenuItem onClick={() => setTheme("light")} className="text-[13px]">
                  <Sun className="mr-2 h-3.5 w-3.5" />
                  {t("light")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="text-[13px]">
                  <Moon className="mr-2 h-3.5 w-3.5" />
                  {t("dark")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="text-[13px]">
                  <Monitor className="mr-2 h-3.5 w-3.5" />
                  {t("system")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 text-[13px]"
              onClick={() => {
                signOut(() => {
                  router.push("/");
                });
              }}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
