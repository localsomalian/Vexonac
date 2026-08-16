import { SidebarTrigger } from "@/components/ui/sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "./ui/breadcrumb";

export function SiteHeader({
	title,
	breadcrumb,
}: {
	title: string | React.ReactNode;
	breadcrumb?: { title: string; url: string };
}) {
	return (
		<header className="sticky top-0 z-50 flex h-12 shrink-0 items-center border-b border-border/40 bg-background/90 backdrop-blur-sm">
			<div className="flex w-full items-center gap-3 px-4">
				<SidebarTrigger className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors" />
				<div className="h-4 w-px bg-border/50" />
				<Breadcrumb>
					<BreadcrumbList className="gap-1 sm:gap-1.5">
						{breadcrumb && (
							<>
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink
										href={breadcrumb.url}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{breadcrumb.title}
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block text-muted-foreground/30" />
							</>
						)}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-semibold text-foreground">
								{title}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>
		</header>
	);
}
