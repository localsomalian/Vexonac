"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { DetectionAlertListener } from "@/components/detection-alert-listener";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDemoPage = pathname?.includes('/server/demo');

  return (
    <AuthProvider requireAuth={!isDemoPage}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="cyber-grid min-h-svh">{children}</SidebarInset>
        <DetectionAlertListener />
      </SidebarProvider>
    </AuthProvider>
  );
}
