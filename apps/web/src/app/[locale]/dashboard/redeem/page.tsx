"use client";

import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import {
	ArrowRight,
	CheckCircle2,
	Clock,
	Loader2,
	Plus,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const redeemSchema = z
	.object({
		licenseKey: z.string().min(1, "License key is required"),
		serverOption: z.enum(["new", "existing"]),
		existingServerId: z.string().optional(),
	})
	.refine(
		(data) => !(data.serverOption === "existing" && !data.existingServerId),
		{ message: "Please select a server", path: ["existingServerId"] }
	);

type RedeemFormValues = z.infer<typeof redeemSchema>;

export default function Redeem() {
	const t = useScopedI18n("redeem");
	const { data: session } = authClient.useSession();
	const router = useRouter();
	const searchParams = useSearchParams();
	const renewServerId = searchParams.get("serverId");
	const queryClient = useQueryClient();
	const [redeemSuccess, setRedeemSuccess] = useState(false);
	const [userHasMadeSelection, setUserHasMadeSelection] = useState(false);
	const [successDetails, setSuccessDetails] = useState<{
		licenseId: string;
		serverName: string;
		message: string;
		expiresAt?: Date;
		licenseType?: string;
	} | null>(null);

	const { data: allUserServers, isLoading: serversLoading } = useQuery(
		trpc.users.getUserServersList.queryOptions("all", {
			enabled: session?.user !== undefined,
			staleTime: 30000,
		})
	);

	const userServers = allUserServers?.filter((s) => s.isOwner) || [];
	const hasServers = userServers.length > 0;

	const expiringSoonServers = userServers.filter((s) => {
		if (!s.expiresAt) return false;
		const days = Math.ceil((new Date(s.expiresAt).getTime() - Date.now()) / 86400000);
		return days <= 30;
	});
	const hasExpiringSoon = expiringSoonServers.length > 0;

	const getExpiryDays = (server: typeof userServers[0]) => {
		if (!server.expiresAt) return null;
		return Math.ceil((new Date(server.expiresAt).getTime() - Date.now()) / 86400000);
	};

	const form = useForm<RedeemFormValues>({
		resolver: zodResolver(redeemSchema),
		defaultValues: {
			licenseKey: "",
			serverOption: renewServerId || hasServers ? "existing" : "new",
			existingServerId: renewServerId || undefined,
		},
	});

	const { mutate: redeemLicense, isPending } = useMutation(
		trpc.licenses.redeemLicenseKey.mutationOptions({
			onSuccess: (data: any) => {
				const licenseTypeMatch = data.message.match(/with a (\w+) license/i);
				setRedeemSuccess(true);
				setSuccessDetails({
					licenseId: data.licenseId,
					serverName: data.serverName,
					message: data.message,
					...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
					...(licenseTypeMatch ? { licenseType: licenseTypeMatch[1] } : {}),
				});
				queryClient.invalidateQueries({ queryKey: [["users", "getUserServersList"]] });
				toast.success("License key redeemed successfully!");
				form.reset();
			},
			onError: (error: TRPCClientErrorLike<any>) => {
				toast.error(error.message || "Failed to redeem license key");
			},
		})
	);

	const watchServerOption = form.watch("serverOption");

	useEffect(() => {
		if (userServers.length === 0 && watchServerOption === "existing") {
			form.setValue("serverOption", "new");
		} else if (userServers.length > 0 && watchServerOption === "new" && !userHasMadeSelection) {
			form.setValue("serverOption", "existing");
		}
	}, [userServers, form, watchServerOption, userHasMadeSelection]);

	const onSubmit = (values: RedeemFormValues) => redeemLicense(values);

	if (redeemSuccess && successDetails) {
		return (
			<ContentLayout title={t("title")}>
				<div className="max-w-lg mx-auto w-full mt-10">
					<div className="rounded-xl border border-border/50 bg-card p-8 text-center">
						<div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
							<CheckCircle2 className="h-7 w-7 text-green-400" />
						</div>
						<h2 className="text-xl font-bold mb-1">{t("redemption_successful")}</h2>
						<p className="text-sm text-muted-foreground mb-6">{successDetails.message}</p>

						<div className="rounded-lg border border-border/40 bg-background/50 divide-y divide-border/30 text-left mb-6">
							<div className="flex items-center justify-between px-4 py-3">
								<span className="text-sm text-muted-foreground">{t("server_name_label")}</span>
								<span className="text-sm font-medium">{formatServerName(successDetails.serverName)}</span>
							</div>
							{successDetails.licenseType && (
								<div className="flex items-center justify-between px-4 py-3">
									<span className="text-sm text-muted-foreground">{t("license_type")}</span>
									<span className="text-sm font-medium capitalize">{successDetails.licenseType}</span>
								</div>
							)}
							<div className="flex items-center justify-between px-4 py-3">
								<span className="text-sm text-muted-foreground">{t("expires_on")}</span>
								<span className="text-sm font-medium">
									{successDetails.licenseType === "lifetime"
										? t("never_expires")
										: successDetails.expiresAt
											? new Date(successDetails.expiresAt).toLocaleDateString()
											: "—"}
								</span>
							</div>
						</div>

						<button
							onClick={() => router.push(`/dashboard/server/${successDetails.licenseId}`)}
							className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
						>
							{t("go_to_dashboard")} <ArrowRight className="h-4 w-4" />
						</button>
					</div>
				</div>
			</ContentLayout>
		);
	}

	return (
		<ContentLayout title={t("title")}>
			<div className="max-w-lg mx-auto w-full mt-6">
				<div className="rounded-xl border border-border/50 bg-card p-6">
					<div className="flex items-center gap-3 mb-6">
						<div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
							<ShieldCheck className="h-5 w-5 text-blue-400" />
						</div>
						<div>
							<h2 className="text-base font-semibold">{t("redeem_your_license")}</h2>
							<p className="text-xs text-muted-foreground mt-0.5">
								{hasExpiringSoon
									? `${expiringSoonServers.length} server${expiringSoonServers.length === 1 ? "" : "s"} expiring soon — extend with your key`
									: t("enter_license_key_description")}
							</p>
						</div>
					</div>

					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
						{/* License Key */}
						<div className="space-y-1.5">
							<Label htmlFor="licenseKey" className="text-sm font-medium">{t("license_key")}</Label>
							<Input
								id="licenseKey"
								placeholder="vexonac-XXXX-XXXX-XXXX"
								className="font-mono bg-background/50 border-border/50 rounded-lg"
								{...form.register("licenseKey")}
							/>
							{form.formState.errors.licenseKey && (
								<p className="text-xs text-red-400">{form.formState.errors.licenseKey.message}</p>
							)}
						</div>

						{/* Option selector */}
						<div className="space-y-2">
							<Label className="text-sm font-medium">{t("redeem_option")}</Label>
							<div className="grid grid-cols-1 gap-2.5">
								{/* New server */}
								<button
									type="button"
									onClick={() => { form.setValue("serverOption", "new"); setUserHasMadeSelection(true); }}
									className={cn(
										"flex items-start gap-3 p-4 rounded-lg border text-left transition-colors",
										watchServerOption === "new"
											? "border-blue-500/50 bg-blue-500/[0.06]"
											: "border-border/50 bg-background/30 hover:border-border hover:bg-white/[0.02]"
									)}
								>
									<div className={cn(
										"h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
										watchServerOption === "new" ? "bg-blue-500/15" : "bg-muted/30"
									)}>
										<Plus className={cn("h-4 w-4", watchServerOption === "new" ? "text-blue-400" : "text-muted-foreground")} />
									</div>
									<div>
										<p className="text-sm font-medium">{t("create_new_server")}</p>
										<p className="text-xs text-muted-foreground mt-0.5">{t("create_new_server_description")}</p>
									</div>
								</button>

								{/* Extend existing */}
								<button
									type="button"
									onClick={() => { form.setValue("serverOption", "existing"); setUserHasMadeSelection(true); }}
									disabled={!hasServers}
									className={cn(
										"flex items-start gap-3 p-4 rounded-lg border text-left transition-colors",
										!hasServers && "opacity-40 cursor-not-allowed",
										hasServers && watchServerOption === "existing"
											? "border-green-500/40 bg-green-500/[0.05]"
											: hasServers
												? "border-border/50 bg-background/30 hover:border-border hover:bg-white/[0.02]"
												: "border-border/30 bg-background/20"
									)}
								>
									<div className={cn(
										"h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
										watchServerOption === "existing" && hasServers ? "bg-green-500/15" : "bg-muted/30"
									)}>
										<RefreshCw className={cn("h-4 w-4", watchServerOption === "existing" && hasServers ? "text-green-400" : "text-muted-foreground")} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium">{t("extend_existing_server")}</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											{hasServers ? t("extend_existing_server_description") : t("no_servers_available_description")}
										</p>
										{hasExpiringSoon && (
											<div className="flex flex-wrap gap-1.5 mt-2">
												{expiringSoonServers.slice(0, 2).map((s) => (
													<span key={s.id} className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
														<Clock className="h-3 w-3" />
														{formatServerName(s.serverName)} — {getExpiryDays(s)}d left
													</span>
												))}
											</div>
										)}
									</div>
								</button>
							</div>
							<input type="hidden" {...form.register("serverOption")} />
						</div>

						{/* Server select dropdown */}
						{watchServerOption === "existing" && hasServers && (
							<div className="space-y-1.5">
								<Label htmlFor="existingServerId" className="text-sm font-medium">{t("select_server")}</Label>
								<Select
									onValueChange={(value) => form.setValue("existingServerId", value)}
									defaultValue={form.watch("existingServerId") ?? ""}
									disabled={serversLoading}
								>
									<SelectTrigger id="existingServerId" className="w-full bg-background/50 border-border/50 rounded-lg">
										<SelectValue placeholder={t("select_server_placeholder")} />
									</SelectTrigger>
									<SelectContent>
										{expiringSoonServers.length > 0 && (
											<>
												<div className="px-2 py-1 text-xs font-medium text-amber-400">Expiring Soon</div>
												{expiringSoonServers.map((s) => (
													<SelectItem key={s.id} value={s.id}>
														{formatServerName(s.serverName)} ({getExpiryDays(s)}d left)
													</SelectItem>
												))}
											</>
										)}
										{userServers.filter((s) => !expiringSoonServers.includes(s)).map((s) => (
											<SelectItem key={s.id} value={s.id}>
												{formatServerName(s.serverName)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{form.formState.errors.existingServerId && (
									<p className="text-xs text-red-400">{form.formState.errors.existingServerId.message}</p>
								)}
							</div>
						)}

						<button
							type="submit"
							disabled={isPending || (watchServerOption === "existing" && !form.watch("existingServerId"))}
							className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
						>
							{isPending ? (
								<><Loader2 className="h-4 w-4 animate-spin" />{t("processing")}</>
							) : (
								t("redeem_license")
							)}
						</button>
					</form>
				</div>
			</div>
		</ContentLayout>
	);
}
