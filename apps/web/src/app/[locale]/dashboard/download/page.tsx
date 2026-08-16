"use client";

import { ContentLayout } from "@/components/content-layout";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Download,
	ExternalLink,
	Gift,
	Shield,
	ShieldAlert,
	Terminal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export default function DownloadPage() {
	const t = useScopedI18n("download");
	const { data: session } = authClient.useSession();
	const router = useRouter();
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [done, setDone] = useState(false);

	const { data: servers = [], isLoading } = useQuery(
		trpc.users.getUserServersList.queryOptions("all", {
			enabled: session?.user !== undefined,
			staleTime: 30000,
		})
	);

	const canDownload = servers.filter((s) => {
		const expiry = new Date(s.expiresAt);
		return expiry > new Date() && (s.isOwner || hasPermission(s.permissions, "DOWNLOAD_FILES"));
	});

	const { mutate: downloadAntiCheat } = useMutation(
		trpc.licenses.downloadAntiCheat.mutationOptions({
			onError: (error: any) => {
				toast.error(error.message || "Failed to download anti-cheat");
				setIsDownloading(false);
				setDownloadProgress(0);
			},
		})
	);

	const handleDownload = useCallback(async () => {
		if (!canDownload.length) {
			toast.error("No active license found");
			return;
		}
		try {
			setIsDownloading(true);
			setDownloadProgress(10);
			const interval = setInterval(() => {
				setDownloadProgress((p) => { const n = p + Math.random() * 15; return n > 90 ? 90 : n; });
			}, 300);
			downloadAntiCheat(void 0, {
				onSuccess: (response) => {
					clearInterval(interval);
					setDownloadProgress(100);
					const bytes = new Uint8Array(atob(response.fileContent).split("").map((c) => c.charCodeAt(0)));
					const blob = new Blob([bytes], { type: "application/zip" });
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url; a.download = response.fileName;
					document.body.appendChild(a);
					setTimeout(() => {
						a.click();
						document.body.removeChild(a);
						URL.revokeObjectURL(url);
						setIsDownloading(false);
						setDownloadProgress(0);
						setDone(true);
						toast.success("Anti-cheat downloaded!");
						setTimeout(() => setDone(false), 3000);
					}, 500);
				},
			});
		} catch (e) {
			toast.error("Failed to download anti-cheat");
			setIsDownloading(false);
			setDownloadProgress(0);
		}
	}, [downloadAntiCheat, canDownload]);

	const steps = [
		t("installation_step_1"),
		t("installation_step_2"),
		t("installation_step_3"),
	];

	const issues = [
		t("common_issue_1"),
		t("common_issue_2"),
		t("common_issue_3"),
	];

	const defenderSteps = [
		{ step: "1", text: 'Open Windows Security → Virus & threat protection' },
		{ step: "2", text: 'Click "Manage settings" under Virus & threat protection settings' },
		{ step: "3", text: 'Scroll down to Exclusions → click "Add or remove exclusions"' },
		{ step: "4", text: 'Click "Add an exclusion" → choose Folder' },
		{ step: "5", text: 'Select the folder where you will extract VexonAC (e.g. C:\\FXServer\\server-data\\resources\\VexonAC)' },
		{ step: "6", text: 'Now extract the zip into that folder — Defender will not delete the files' },
	];

	return (
		<ContentLayout title={t("title")}>
			<div className="max-w-5xl mx-auto space-y-4 mt-2">

			{/* Windows Defender warning */}
			<div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
				<div className="flex items-start gap-3">
					<ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
					<div className="flex-1 space-y-3">
						<div>
							<p className="text-sm font-semibold text-red-400">Windows Defender False Positive — Read Before Downloading</p>
							<p className="text-xs text-muted-foreground mt-1">
								VexonAC uses <strong className="text-foreground">Luraph obfuscation</strong> and anti-tamper code to protect against crackers.
								Windows Defender (and some other AV tools) will flag these files as malware — <strong className="text-foreground">this is a false positive</strong>.
								The files are safe. You <strong className="text-foreground">must add a Defender exclusion before extracting</strong> or the files will be deleted automatically.
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-xs font-medium text-foreground flex items-center gap-1.5">
								<Shield className="h-3.5 w-3.5 text-blue-400" />
								How to add a Windows Defender exclusion:
							</p>
							<div className="space-y-1.5">
								{defenderSteps.map(({ step, text }) => (
									<div key={step} className="flex items-start gap-2.5">
										<span className="h-4 w-4 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
											{step}
										</span>
										<p className="text-xs text-muted-foreground">{text}</p>
									</div>
								))}
							</div>
						</div>
						<p className="text-xs text-amber-400/80">
							⚠ If Defender already quarantined the files: go to Windows Security → Protection history → restore the quarantined items, then add the exclusion.
						</p>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

				{/* Download card */}
				<div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col gap-6">
					<div>
						<h2 className="text-base font-semibold">{t("download_vexonac")}</h2>
						<p className="text-xs text-muted-foreground mt-0.5">{t("download_description")}</p>
					</div>

					{isLoading ? (
						<div className="flex items-center justify-center h-32">
							<div className="h-7 w-7 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
						</div>
					) : canDownload.length > 0 ? (
						<div className="flex flex-col items-center gap-4">
							<button
								onClick={handleDownload}
								disabled={isDownloading}
								className="group relative h-32 w-32 rounded-full border border-border/50 bg-background/50 hover:bg-blue-500/5 hover:border-blue-500/30 flex flex-col items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
							>
								{isDownloading ? (
									<>
										<svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
											<circle cx="50" cy="50" r="46" stroke="hsl(var(--border))" strokeWidth="3" fill="none" />
											<circle
												cx="50" cy="50" r="46"
												stroke="#3b82f6" strokeWidth="3" fill="none"
												strokeLinecap="round"
												strokeDasharray="289"
												strokeDashoffset={289 - (downloadProgress / 100) * 289}
												className="transition-all duration-300"
											/>
										</svg>
										<span className="text-xl font-bold z-10">{Math.round(downloadProgress)}%</span>
										<span className="text-xs text-muted-foreground z-10">{t("downloading")}</span>
									</>
								) : done ? (
									<><CheckCircle2 className="h-8 w-8 text-green-400" /><span className="text-xs text-green-400">Done!</span></>
								) : (
									<><Download className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform" /><span className="text-xs text-muted-foreground">{t("title")}</span></>
								)}
							</button>
							<p className="text-xs text-center text-muted-foreground">
								Click the button above to download the latest VexonAC release
							</p>
						</div>
					) : (
						<div className="flex flex-col items-center gap-3 py-6 text-center">
							<div className="h-12 w-12 rounded-xl border border-dashed border-border/50 flex items-center justify-center">
								<AlertTriangle className="h-5 w-5 text-muted-foreground/40" />
							</div>
							<p className="text-sm font-medium">{t("no_licenses")}</p>
							<p className="text-xs text-muted-foreground">{t("no_licenses_description")}</p>
							<button
								onClick={() => router.push("/dashboard/redeem")}
								className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
							>
								<Gift className="h-3.5 w-3.5" />
								{t("redeem_license")}
							</button>
						</div>
					)}
				</div>

				{/* Install guide */}
				<div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-6 flex flex-col gap-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-base font-semibold">{t("installation_guide")}</h2>
							<p className="text-xs text-muted-foreground mt-0.5">Get protected in under 5 minutes</p>
						</div>
						<a
							href="https://docs.vexonac.com"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
						>
							{t("read_more")} <ExternalLink className="h-3 w-3" />
						</a>
					</div>

					{/* Steps */}
					<div className="space-y-4">
						{steps.map((step, i) => (
							<div key={i} className="flex gap-4">
								<div className="h-7 w-7 rounded-full border border-border/50 bg-background/50 flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
									{i + 1}
								</div>
								<div className="flex-1 pt-0.5">
									<p className="text-sm text-foreground/90">{step}</p>
									{i === 1 && (
										<div className="mt-2 rounded-lg border border-border/40 bg-background/60 px-4 py-3">
											<code className="text-xs text-blue-400 font-mono whitespace-pre">{`ensure VexonAC\nadd_ace resource.VexonAC command allow`}</code>
										</div>
									)}
								</div>
							</div>
						))}
					</div>

					{/* Common issues */}
					<div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
						<div className="flex items-center gap-2 mb-3">
							<AlertTriangle className="h-4 w-4 text-amber-400" />
							<p className="text-sm font-medium text-amber-400">{t("common_issues")}</p>
						</div>
						<ul className="space-y-1.5">
							{issues.map((issue, i) => (
								<li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
									<span className="text-amber-400 mt-0.5">·</span>
									{issue}
								</li>
							))}
						</ul>
					</div>

					{/* Help */}
					<div className="flex items-center justify-between pt-1 border-t border-border/30">
						<p className="text-xs text-muted-foreground">{t("need_help")}</p>
						<a
							href="https://discord.gg/NrzrubrYad"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
						>
							{t("join_discord")} <ArrowRight className="h-3 w-3" />
						</a>
					</div>
				</div>
			</div>
			</div>
		</ContentLayout>
	);
}
