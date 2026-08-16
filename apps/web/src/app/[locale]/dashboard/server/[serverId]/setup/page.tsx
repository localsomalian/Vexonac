"use client";

import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Terminal,
  Webhook,
  Zap,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

function CopyBlock({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 font-mono text-sm">
      <span className="flex-1 truncate text-muted-foreground">{label ?? value}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copy}>
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {number}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {children && <CardContent className="pt-0 pl-14">{children}</CardContent>}
    </Card>
  );
}

export default function SetupPage() {
  const params = useParams();
  const { data: session } = useSession();
  const serverId = params.serverId as string;

  const { data: server, isLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, { enabled: !!session }),
  );

  const licenseKey = server?.licenseKey ?? "";
  const ingressUrl = process.env.NEXT_PUBLIC_INGRESS_API_URL ?? "https://ingress.vexonac.com";

  const serverCfgBlock = `# VexonAC Anti-Cheat
set vexonac_ingress_url "${ingressUrl}"
set vexonac_ingress_key "${licenseKey}"

# Make sure ensure runs AFTER your framework resource
ensure VexonAC`;

  return (
    <ContentLayout title={`Setup Guide — ${formatServerName(server?.serverName)}`}>
      <div className="max-w-3xl space-y-4">
        {/* Status banner */}
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-400">License active</p>
            <p className="text-xs text-muted-foreground">
              Follow the steps below to connect your FiveM server to VexonAC.
            </p>
          </div>
          <Badge variant="outline" className="ml-auto shrink-0">
            {server?.plan ?? "—"}
          </Badge>
        </div>

        {/* Step 1 — Download */}
        <Step
          number={1}
          title="Download the VexonAC resource"
          description="Download and extract the resource into your FiveM server resources folder."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="gap-2">
              <a href="/api/licenses/download" download>
                <Download className="h-4 w-4" />
                Download VexonAC.zip
              </a>
            </Button>
            <p className="self-center text-xs text-muted-foreground">
              Extract to <code className="bg-muted px-1 rounded">resources/[vexonac]/VexonAC/</code>
            </p>
          </div>
        </Step>

        {/* Step 2 — server.cfg */}
        <Step
          number={2}
          title="Add convars to server.cfg"
          description="Add these lines to your server.cfg to connect the resource to the panel."
        >
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/50">
              <div className="flex items-center justify-between border-b px-3 py-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Terminal className="h-3 w-3" />
                  server.cfg
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  onClick={() => navigator.clipboard.writeText(serverCfgBlock)}
                >
                  <Copy className="h-3 w-3" />
                  Copy all
                </Button>
              </div>
              <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-muted-foreground">
                {isLoading ? "Loading..." : serverCfgBlock}
              </pre>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your values
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <CopyBlock value={licenseKey} label={`vexonac_ingress_key = ${licenseKey}`} />
              )}
              <CopyBlock value={ingressUrl} label={`vexonac_ingress_url = ${ingressUrl}`} />
            </div>
          </div>
        </Step>

        {/* Step 3 — Discord webhooks */}
        <Step
          number={3}
          title="Configure Discord notifications"
          description="Set up webhook URLs in Configuration → Discord Integration so VexonAC can post bans, detections, and connections to your Discord."
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {[
                { name: "MainWebhook", desc: "Bans, all general alerts" },
                { name: "WeaponsWebhook", desc: "Weapon cheat detections" },
                { name: "ExplosionsWebhook", desc: "Explosion spam" },
                { name: "EntitiesWebhook", desc: "Entity spam" },
                { name: "ConnectionsWebhook", desc: "Player join/leave" },
                { name: "ScreenshotsWebhook", desc: "Evidence screenshots" },
              ].map(({ name, desc }) => (
                <div key={name} className="flex items-center gap-2 rounded border p-2">
                  <Webhook className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-xs">{name}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={`/dashboard/server/${serverId}/configuration`}>
                <ExternalLink className="h-3.5 w-3.5" />
                Open Configuration
              </a>
            </Button>
          </div>
        </Step>

        {/* Step 4 — Start server */}
        <Step
          number={4}
          title="Start your server"
          description="Restart your FiveM server. VexonAC will connect automatically and appear as online in your dashboard."
        >
          <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/10 p-3">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm">
              Once connected, go to your{" "}
              <a href={`/dashboard/server/${serverId}`} className="underline underline-offset-2">
                server overview
              </a>{" "}
              and you should see the status turn <span className="text-green-400">Online</span>.
            </p>
          </div>
        </Step>

        {/* Step 5 — Test */}
        <Step
          number={5}
          title="Test it's working"
          description="Join your server in FiveM. The Players tab should show you as online within 30 seconds."
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              ✅ Player appears in{" "}
              <a href={`/dashboard/server/${serverId}/players`} className="underline underline-offset-2">
                Players tab
              </a>
            </p>
            <p>✅ Detections fire in your MainWebhook Discord channel</p>
            <p>✅ Ban via dashboard kicks the player instantly</p>
            <p className="text-xs pt-1">
              If nothing appears after 2 minutes, check that{" "}
              <code className="bg-muted px-1 rounded">vexonac_ingress_key</code> is correct and the
              resource started without errors in the FiveM server console.
            </p>
          </div>
        </Step>
      </div>
    </ContentLayout>
  );
}
