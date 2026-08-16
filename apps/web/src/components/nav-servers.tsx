"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatServerName } from "./format-server-name";

export function NavServers({
	items,
}: {
	items: {
		serverId: string;
		serverName: string;
		isOnline?: boolean;
		icon: LucideIcon;
		isActive?: boolean;
		items?: { title: string; url: string; icon?: LucideIcon; visible?: boolean }[];
	}[];
}) {
	if (items.length === 0) return null;

	const pathname = usePathname();
	const lastOpenedServerRef = useRef<string | null>(
		items.length > 0 ? items[0].serverId : null
	);

	const isInServerPath = pathname.includes("/dashboard/server/");
	const currentServerId = isInServerPath
		? pathname.split("/dashboard/server/")[1]?.split("/")[0]
		: null;

	if (currentServerId) lastOpenedServerRef.current = currentServerId;

	const shouldBeOpen = (item: (typeof items)[0]) => {
		if (!isInServerPath) return item.serverId === lastOpenedServerRef.current;
		return currentServerId === item.serverId;
	};

	return (
		<SidebarGroup className="py-2 border-t border-border/40">
			<SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/60 px-3 mb-1">
				Servers
			</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={`${item.serverId}-${currentServerId || lastOpenedServerRef.current || "default"}`}
						asChild
						defaultOpen={shouldBeOpen(item)}
						className="group/collapsible"
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton
									tooltip={String(formatServerName(item.serverName) ?? item.serverName)}
									className="rounded-lg mx-1 hover:bg-white/5 transition-colors"
								>
									<span className={cn("h-2 w-2 rounded-full shrink-0", item.isOnline ? "bg-green-400/70" : "bg-zinc-500/50")} />
									<span className="flex-1 min-w-0 truncate text-[13px]">
										{formatServerName(item.serverName)}
									</span>
									<ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</SidebarMenuButton>
							</CollapsibleTrigger>
							{item.items?.length ? (
								<CollapsibleContent>
									<SidebarMenuSub className="ml-4 border-l border-border/30 pl-0">
										{item.items
											.filter((sub) => sub.visible)
											.map((sub) => {
												const subActive = pathname.endsWith(sub.url) || false;
												return (
													<SidebarMenuSubItem key={sub.title}>
														<SidebarMenuSubButton
															asChild
															isActive={subActive}
															className={cn(
																"rounded-lg ml-0 pl-3 text-[12px] transition-colors",
																subActive
																	? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/15 hover:text-blue-400 font-medium"
																	: "hover:bg-white/5"
															)}
														>
															<Link href={sub.url}>
																{sub.icon && (
																	<sub.icon className={cn("h-3.5 w-3.5 shrink-0", subActive && "text-blue-400")} />
																)}
																<span>{sub.title}</span>
															</Link>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												);
											})}
									</SidebarMenuSub>
								</CollapsibleContent>
							) : null}
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
