"use client";

import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
	items,
}: {
	items: { title: string; url: string; icon: LucideIcon }[];
}) {
	const pathname = usePathname();

	return (
		<SidebarGroup className="py-2">
			<SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/60 px-3 mb-1">
				General
			</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const active = pathname.endsWith(item.url) || false;
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									isActive={active}
									tooltip={item.title}
									className={cn(
										"rounded-lg mx-1 transition-colors",
										active
											? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/15 hover:text-blue-400"
											: "hover:bg-white/5"
									)}
								>
									<Link href={item.url}>
										<item.icon className={cn("h-4 w-4 shrink-0", active && "text-blue-400")} />
										<span className={cn("text-[13px]", active && "font-medium")}>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
