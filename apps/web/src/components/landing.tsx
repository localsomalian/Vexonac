"use client";

import { signIn } from "@/lib/auth-client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	locales,
	useChangeLocale,
	useCurrentLocale,
	useScopedI18n,
} from "@/locales/client";
import { toast } from "sonner";
import {
	Activity,
	ArrowRight,
	Check,
	Globe,
	Languages,
	Lock,
	Map,
	Menu,
	MousePointerClick,
	Radio,
	ScrollText,
	Search,
	Server,
	Settings,
	Shield,
	ShieldCheck,
	ShieldOff,
	Users,
	X,
	Zap,
	Eye,
	Ban,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LandingFAQSection } from "./faq-section";

/* ── brand tokens (mirror dashboard CSS variables) ───────────────── */
const C = {
	bg:          "#0c0e14",   /* --background: oklch(0.09 0.01 265)  */
	card:        "#131820",   /* --card:        oklch(0.13 0.025 258) */
	border:      "rgba(255,255,255,0.07)",
	borderAccent:"rgba(34,211,238,0.2)",
	primary:     "#22d3ee",   /* --primary: oklch(0.78 0.17 197)      */
	primaryDark: "#0e7490",   /* darker shade for hover bg            */
	primaryFg:   "#06080f",   /* --primary-foreground (dark on cyan)  */
	muted:       "#3b5060",   /* --muted-foreground approx            */
	subtle:      "#1e2838",   /* subtle border / divider              */
	text:        "#e8ecf0",   /* --foreground approx                  */
	textMuted:   "#7a8fa0",   /* dim body copy                        */
	navBg:       "rgba(12,14,20,0.88)",
};

const DISCORD = "https://discord.gg/NrzrubrYad";

const DiscordIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
		<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
	</svg>
);

const LanguageSwitcher = () => {
	const changeLocale = useChangeLocale();
	const currentLocale = useCurrentLocale();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="p-2 rounded-md transition-colors" style={{ color: C.textMuted }}
					onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
					onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
					aria-label="Change language">
					<Languages className="h-4 w-4" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" style={{ background: C.card, border: `1px solid ${C.subtle}` }}>
				{locales.map((locale) => (
					<DropdownMenuItem key={locale.code} onClick={() => changeLocale(locale.code)}
						className="gap-3 text-sm cursor-pointer"
						style={{ color: C.textMuted }}>
						<span>{locale.name}</span>
						{currentLocale === locale.code && <Check className="ml-auto h-3.5 w-3.5" style={{ color: C.primary }} />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
	const [val, setVal] = useState(0);
	const ref = useRef<HTMLSpanElement>(null);
	const ran = useRef(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(([e]) => {
			if (e.isIntersecting && !ran.current) {
				ran.current = true;
				const dur = 1600;
				const start = performance.now();
				const tick = (now: number) => {
					const p = Math.min((now - start) / dur, 1);
					setVal(Math.floor(p * to));
					if (p < 1) requestAnimationFrame(tick); else setVal(to);
				};
				requestAnimationFrame(tick);
			}
		}, { threshold: 0.5 });
		obs.observe(el);
		return () => obs.disconnect();
	}, [to]);
	return <span ref={ref}>{val}{suffix}</span>;
}

/* Severity colors are data colors, not brand — keep red/orange/yellow */
const EVENTS = [
	{ level: "CRITICAL", code: "AIMBOT_DETECTED",  player: "xX_1337hax_Xx",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
	{ level: "HIGH",     code: "SPEEDHACK",         player: "NoLifeGamer99",   color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)"  },
	{ level: "CRITICAL", code: "LUA_INJECTION",     player: "m0dmenU_us3r",   color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
	{ level: "MEDIUM",   code: "GODMODE",           player: "SuspectPlayer44", color: "#eab308", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)"   },
	{ level: "HIGH",     code: "NOCLIP",            player: "GhostWalker_X",   color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)"  },
	{ level: "CRITICAL", code: "DAMAGE_MOD",        player: "OneHit_King",     color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
];

function LiveDetectionFeed() {
	const [visible, setVisible] = useState<number[]>([]);
	const ref = useRef<HTMLDivElement>(null);
	const ran = useRef(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(([e]) => {
			if (e.isIntersecting && !ran.current) {
				ran.current = true;
				EVENTS.forEach((_, i) => setTimeout(() => setVisible(p => [...p, i]), i * 420));
			}
		}, { threshold: 0.3 });
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	return (
		<div ref={ref} className="space-y-2">
			{EVENTS.map((ev, i) => (
				<div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg" style={{
					background:  visible.includes(i) ? ev.bg : "transparent",
					border:      `1px solid ${visible.includes(i) ? ev.border : "transparent"}`,
					opacity:     visible.includes(i) ? 1 : 0,
					transform:   visible.includes(i) ? "translateX(0)" : "translateX(-8px)",
					transition:  "all 0.4s ease",
				}}>
					<span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: ev.bg, border: `1px solid ${ev.border}`, color: ev.color }}>
						{ev.level}
					</span>
					<span className="font-mono text-xs font-semibold" style={{ color: ev.color }}>{ev.code}</span>
					<span className="text-xs ml-auto font-mono" style={{ color: C.muted }}>{ev.player}</span>
					{visible.includes(i) && <Ban className="h-3 w-3 shrink-0" style={{ color: "#ef4444" }} />}
				</div>
			))}
		</div>
	);
}

/* ── main component ───────────────────────────────────────────────── */

export function Landing() {
	const t = useScopedI18n("landing");
	const [menuOpen, setMenuOpen] = useState(false);
	const [signingIn, setSigningIn] = useState(false);

	const handleSignIn = async () => {
		setSigningIn(true);
		try { await signIn(); }
		catch { toast.error("Failed to sign in"); }
		finally { setSigningIn(false); }
	};

	const navLinks = [
		{ label: t("nav.features"), href: "#features" },
		{ label: "Panel",           href: "#panel"    },
		{ label: t("nav.pricing"),  href: "#pricing"  },
		{ label: t("nav.faqs"),     href: "#faqs"     },
	];

	return (
		<div className="min-h-screen text-white antialiased overflow-x-hidden" style={{ background: C.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
			<style>{`
				@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
				@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
				/* dot-grid matches dashboard cyber-grid utility */
				.landing-grid {
					background-image: radial-gradient(circle, rgba(34,211,238,0.055) 1px, transparent 1px);
					background-size: 28px 28px;
				}
			`}</style>

			{/* ── NAVBAR ──────────────────────────────────────────── */}
			<header className="fixed top-0 inset-x-0 z-50" style={{
				background: C.navBg,
				backdropFilter: "blur(16px)",
				borderBottom: `1px solid ${C.subtle}`,
			}}>
				<div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-8">
					<Link href="/" className="flex items-center gap-2.5 shrink-0 select-none">
						<Image src="/logo.png" alt="VexonAC" width={32} height={32} style={{ objectFit: "contain" }} unoptimized />
						<span className="font-bold text-[15px] tracking-tight" style={{ color: C.text }}>VexonAC</span>
					</Link>

					<nav className="hidden md:flex items-center gap-0.5">
						{navLinks.map((l) => (
							<a key={l.href} href={l.href}
								className="px-3.5 py-1.5 rounded-md text-sm transition-colors"
								style={{ color: C.textMuted }}
								onMouseEnter={e => (e.currentTarget.style.color = C.text)}
								onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}>
								{l.label}
							</a>
						))}
					</nav>

					<div className="hidden md:flex items-center gap-2">
						<LanguageSwitcher />
						<button onClick={handleSignIn} disabled={signingIn}
							className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
							style={{ background: C.primary, color: C.primaryFg, boxShadow: `0 0 16px ${C.primary}40` }}>
							<DiscordIcon className="h-3.5 w-3.5" />
							{signingIn ? "Signing in…" : t("nav.signin")}
						</button>
					</div>

					<button className="md:hidden p-2 rounded-md" style={{ color: C.textMuted }}
						onClick={() => setMenuOpen(!menuOpen)}>
						{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>

				{menuOpen && (
					<div className="md:hidden px-5 py-3 flex flex-col gap-1 border-t" style={{ borderColor: C.subtle, background: C.bg }}>
						{navLinks.map((l) => (
							<a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
								className="px-3 py-2.5 rounded-md text-sm" style={{ color: C.textMuted }}>{l.label}</a>
						))}
						<div className="pt-2 flex items-center gap-2">
							<LanguageSwitcher />
							<button onClick={handleSignIn} disabled={signingIn}
								className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
								style={{ background: C.primary, color: C.primaryFg }}>
								<DiscordIcon className="h-3.5 w-3.5" />
								{signingIn ? "Signing in…" : t("nav.signin")}
							</button>
						</div>
					</div>
				)}
			</header>

			{/* ── HERO ────────────────────────────────────────────── */}
			<section className="relative pt-32 pb-24 px-5 overflow-hidden landing-grid">
				<div className="absolute inset-0 pointer-events-none" aria-hidden>
					<div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,211,238,0.07) 0%, transparent 70%)" }} />
					<div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.primary}40, transparent)` }} />
				</div>

				<div className="max-w-4xl mx-auto text-center relative">
					{/* Live badge */}
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8" style={{
						background: `rgba(34,211,238,0.08)`,
						border: C.borderAccent,
						color: "#67e8f9",
					}}>
						<span className="relative flex h-1.5 w-1.5">
							<span className="animate-ping absolute h-full w-full rounded-full opacity-75" style={{ background: C.primary }} />
							<span className="relative h-1.5 w-1.5 rounded-full" style={{ background: C.primary }} />
						</span>
						{t("hero.badge")}
					</div>

					<h1 className="font-black leading-[1.05] tracking-tighter mb-6" style={{ fontSize: "clamp(2.6rem,6vw,4.5rem)", color: C.text }}>
						{t("hero.title")}{" "}
						<span style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #818cf8 60%, #a78bfa 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
							VexonAC
						</span>
					</h1>

					<p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: C.textMuted }}>
						{t("hero.subtitle")}
					</p>

					<div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
						<a href="#pricing"
							className="group inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
							style={{ background: C.primary, color: C.primaryFg, boxShadow: `0 4px 24px ${C.primary}40` }}>
							{t("hero.get_started")}
							<ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
						</a>
						<a href={DISCORD} target="_blank" rel="noopener noreferrer"
							className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg text-sm font-bold transition-all hover:opacity-80"
							style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: "#d1d5db" }}>
							<DiscordIcon className="h-4 w-4" />
							Join Discord
						</a>
					</div>

					{/* Stats row */}
					<div className="flex flex-wrap items-center justify-center gap-10">
						{[
							{ val: 10,   suffix: "+",   label: "Servers Protected" },
							{ val: 1000, suffix: "+",   label: "Cheaters Banned"   },
							{ val: 99,   suffix: ".9%", label: "Detection Rate"    },
						].map((s) => (
							<div key={s.label} className="text-center">
								<div className="text-3xl font-black mb-0.5" style={{ color: C.primary }}>
									<Counter to={s.val} suffix={s.suffix} />
								</div>
								<div className="text-xs" style={{ color: C.muted }}>{s.label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── LIVE DETECTION FEED ─────────────────────────────── */}
			<section className="py-16 px-5" style={{ borderTop: `1px solid ${C.subtle}`, borderBottom: `1px solid ${C.subtle}` }}>
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center justify-between mb-5">
						<div className="flex items-center gap-2">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute h-full w-full rounded-full opacity-75" style={{ background: C.primary }} />
								<span className="relative h-2 w-2 rounded-full" style={{ background: C.primary }} />
							</span>
							<span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.primary }}>Live Detection Feed</span>
						</div>
						<span className="text-xs font-mono" style={{ color: C.muted }}>vexonac — engine v2</span>
					</div>
					<div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.subtle}` }}>
						<div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.subtle}` }}>
							<span className="h-2 w-2 rounded-full" style={{ background: "#ff5f57" }} />
							<span className="h-2 w-2 rounded-full" style={{ background: "#febc2e" }} />
							<span className="h-2 w-2 rounded-full" style={{ background: "#28c840" }} />
							<span className="ml-2 text-xs font-mono" style={{ color: C.muted }}>detections — real time</span>
						</div>
						<div className="p-4">
							<LiveDetectionFeed />
						</div>
					</div>
				</div>
			</section>

			{/* ── HOW IT WORKS ────────────────────────────────────── */}
			<section className="py-24 px-5" style={{ borderTop: `1px solid ${C.subtle}` }}>
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-16">
						<p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>Simple Setup</p>
						<h2 className="font-black tracking-tight" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", color: C.text }}>Up and running in minutes</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-5">
						{[
							{ n: "01", icon: Zap,        title: "Install the Resource", desc: "Drop VexonAC into your FiveM server. Your license activates in seconds — no config files, no restarts needed." },
							{ n: "02", icon: Eye,         title: "Scan Every Player",    desc: "VexonAC watches movement, aim patterns, resources, and identifiers across all connected players in real time." },
							{ n: "03", icon: ShieldCheck, title: "Act Instantly",        desc: "Cheaters are banned the moment they're caught. Your Discord gets notified, logs stored, server stays clean." },
						].map((s) => {
							const Icon = s.icon;
							return (
								<div key={s.n} className="p-6 rounded-xl" style={{ background: C.card, border: `1px solid ${C.subtle}` }}>
									<div className="flex items-center gap-3 mb-4">
										<span className="text-xs font-black" style={{ color: C.primary }}>{s.n}</span>
										<div className="h-px flex-1" style={{ background: `${C.primary}25` }} />
										<Icon className="h-4 w-4 shrink-0" style={{ color: C.primary }} />
									</div>
									<h3 className="font-bold text-sm mb-2" style={{ color: C.text }}>{s.title}</h3>
									<p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{s.desc}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ── FEATURES ────────────────────────────────────────── */}
			<section id="features" className="py-24 px-5" style={{ borderTop: `1px solid ${C.subtle}` }}>
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>Protection</p>
						<h2 className="font-black tracking-tight mb-4" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", color: C.text }}>{t("features.title")}</h2>
						<p className="text-base max-w-xl mx-auto" style={{ color: C.textMuted }}>{t("features.subtitle")}</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[
							{ icon: Activity,          title: t("features.list.web_panel.title"),           desc: t("features.list.web_panel.description")           },
							{ icon: Globe,             title: t("features.list.network_intelligence.title"), desc: t("features.list.network_intelligence.description") },
							{ icon: MousePointerClick, title: t("features.list.anti_aimbot.title"),          desc: t("features.list.anti_aimbot.description")          },
							{ icon: Lock,              title: t("features.list.event_protection.title"),     desc: t("features.list.event_protection.description")     },
							{ icon: Shield,            title: t("features.list.advanced_detections.title"), desc: t("features.list.advanced_detections.description")  },
							{ icon: Zap,               title: t("features.list.plug_play.title"),           desc: t("features.list.plug_play.description")           },
						].map((f) => {
							const Icon = f.icon;
							return (
								<div key={f.title} className="p-5 rounded-xl transition-all" style={{ background: C.card, border: `1px solid ${C.subtle}` }}
									onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderAccent)}
									onMouseLeave={e => (e.currentTarget.style.borderColor = C.subtle)}>
									<div className="h-8 w-8 rounded-lg flex items-center justify-center mb-4" style={{ background: `rgba(34,211,238,0.08)`, border: `1px solid ${C.borderAccent}` }}>
										<Icon className="h-4 w-4" style={{ color: C.primary }} />
									</div>
									<h3 className="font-semibold text-sm mb-2" style={{ color: C.text }}>{f.title}</h3>
									<p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{f.desc}</p>
								</div>
							);
						})}
					</div>

					<div className="mt-8 flex flex-wrap gap-2 justify-center">
						{["Aimbot", "Speedhack", "NoClip", "Godmode", "Lua Injection", "ESP", "Damage Mod", "Explosion Spam", "Entity Spam", "HWID Ban"].map((tag) => (
							<span key={tag} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: `rgba(34,211,238,0.06)`, border: C.borderAccent, color: "#67e8f9" }}>
								{tag}
							</span>
						))}
					</div>
				</div>
			</section>

			{/* ── PANEL SHOWCASE ──────────────────────────────────── */}
			<section id="panel" className="py-24 px-5" style={{ borderTop: `1px solid ${C.subtle}` }}>
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>Dashboard</p>
						<h2 className="font-black tracking-tight mb-4" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", color: C.text }}>Everything in one panel</h2>
						<p className="text-base max-w-xl mx-auto" style={{ color: C.textMuted }}>Sign in with Discord and manage your entire server — no technical setup required.</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{[
							{ icon: Server,     title: "Server Dashboard", desc: "Live stats, player count, analytics & license management." },
							{ icon: Users,      title: "Players",          desc: "Browse every player, view profiles and session history."   },
							{ icon: Map,        title: "Interactive Map",  desc: "See every player's live location on the GTA map."           },
							{ icon: Radio,      title: "Multi Stream",     desc: "Watch multiple player POVs on one screen."                 },
							{ icon: ShieldOff,  title: "Bans",             desc: "View, manage and appeal all bans issued."                  },
							{ icon: Settings,   title: "Configuration",    desc: "Fine-tune every detection module for your server."         },
							{ icon: Search,     title: "Lookup",           desc: "Instantly search any player by name, license, or ID."      },
							{ icon: Shield,     title: "Admins",           desc: "Assign roles and granular permissions to your staff."       },
							{ icon: ScrollText, title: "Logs",             desc: "Full audit trail of every detection and admin action."     },
						].map((p) => {
							const Icon = p.icon;
							return (
								<button key={p.title} onClick={handleSignIn}
									className="group text-left p-4 rounded-xl cursor-pointer transition-all"
									style={{ background: C.card, border: `1px solid ${C.subtle}` }}
									onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderAccent; e.currentTarget.style.background = `rgba(34,211,238,0.03)`; }}
									onMouseLeave={e => { e.currentTarget.style.borderColor = C.subtle; e.currentTarget.style.background = C.card; }}>
									<div className="flex items-start justify-between mb-3">
										<Icon className="h-4 w-4" style={{ color: C.primary }} />
										<ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: C.primary }} />
									</div>
									<h3 className="font-semibold text-sm mb-1" style={{ color: C.text }}>{p.title}</h3>
									<p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{p.desc}</p>
								</button>
							);
						})}
					</div>

					<div className="mt-8 flex justify-center">
						<button onClick={handleSignIn} disabled={signingIn}
							className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
							style={{ background: C.primary, color: C.primaryFg, boxShadow: `0 4px 20px ${C.primary}30` }}>
							<DiscordIcon className="h-4 w-4" />
							{signingIn ? "Signing in…" : "Open Your Panel"}
						</button>
					</div>
				</div>
			</section>

			{/* ── PRICING ─────────────────────────────────────────── */}
			<section id="pricing" className="py-24 px-5 relative overflow-hidden" style={{ borderTop: `1px solid ${C.subtle}` }}>
				<div className="absolute inset-0 pointer-events-none" aria-hidden>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]" style={{ background: `radial-gradient(ellipse at center, rgba(34,211,238,0.05), transparent 70%)` }} />
				</div>
				<div className="max-w-5xl mx-auto relative">
					<div className="text-center mb-16">
						<p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>Pricing</p>
						<h2 className="font-black tracking-tight mb-4" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", color: C.text }}>{t("pricing.title")}</h2>
						<p className="text-base max-w-xl mx-auto" style={{ color: C.textMuted }}>{t("pricing.subtitle")}</p>
					</div>

					{(() => {
						const plans = [
							{ id: "monthly",   name: t("pricing.plans.monthly.name"),   price: t("pricing.plans.monthly.price"),   period: t("pricing.plans.monthly.period"),   feat: t("pricing.plans.monthly.feature_1"),   hot: false },
							{ id: "quarterly", name: t("pricing.plans.quarterly.name"), price: t("pricing.plans.quarterly.price"), period: t("pricing.plans.quarterly.period"), feat: t("pricing.plans.quarterly.feature_1"), hot: true  },
							{ id: "lifetime",  name: t("pricing.plans.lifetime.name"),  price: t("pricing.plans.lifetime.price"),  period: t("pricing.plans.lifetime.period"),  feat: t("pricing.plans.lifetime.feature_1"),  hot: false },
						];
						const common = [t("pricing.features.all_features"), t("pricing.features.web_panel"), t("pricing.features.support"), t("pricing.features.instant_delivery")];
						return (
							<div className="grid md:grid-cols-3 gap-4 items-stretch">
								{plans.map((p) => (
									<div key={p.id} className="relative rounded-xl p-6 flex flex-col gap-6"
										style={p.hot
											? { background: `rgba(34,211,238,0.05)`, border: `1px solid ${C.primary}50`, boxShadow: `0 0 40px ${C.primary}0a` }
											: { background: C.card, border: `1px solid ${C.subtle}` }}>
										{p.hot && (
											<>
												<div className="absolute -top-px left-1/2 -translate-x-1/2 h-px w-2/3" style={{ background: `linear-gradient(90deg, transparent, ${C.primary}90, transparent)` }} />
												<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold" style={{ background: C.primary, color: C.primaryFg }}>
													{t("pricing.popular_badge")}
												</div>
											</>
										)}
										<div>
											<p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>{p.name}</p>
											<div className="flex items-end gap-1 mb-1">
												<span className="text-5xl font-black" style={{ color: p.hot ? C.primary : C.text }}>{p.price}</span>
												<span className="text-sm mb-2" style={{ color: C.muted }}>/ {p.period}</span>
											</div>
											<p className="text-xs" style={{ color: C.muted }}>{p.feat}</p>
										</div>
										<ul className="flex flex-col gap-2.5 flex-1">
											{common.map((f) => (
												<li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: C.textMuted }}>
													<Check className="h-3.5 w-3.5 shrink-0" style={{ color: C.primary }} />
													{f}
												</li>
											))}
										</ul>
										<a href={DISCORD} target="_blank" rel="noopener noreferrer"
											className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
											style={p.hot
												? { background: C.primary, color: C.primaryFg, boxShadow: `0 4px 16px ${C.primary}35` }
												: { background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: "#d1d5db" }}>
											<DiscordIcon className="h-4 w-4" />
											{t("pricing.purchase")}
										</a>
									</div>
								))}
							</div>
						);
					})()}
				</div>
			</section>

			{/* ── TESTIMONIALS ────────────────────────────────────── */}
			<section className="py-24 px-5" style={{ borderTop: `1px solid ${C.subtle}` }}>
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-12">
						<p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>Community</p>
						<h2 className="font-black tracking-tight" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", color: C.text }}>Trusted by server owners</h2>
					</div>
					<div className="grid md:grid-cols-3 gap-4">
						{[
							{ name: "Marcus R.", role: "Owner · Redline RP",  quote: "Cut cheater incidents by 80% in our first week. The aimbot detection alone was worth it." },
							{ name: "Jayden T.", role: "Dev · NLS Roleplay",   quote: "Finally an anti-cheat that actually catches lua injectors. Nothing else we tried came close." },
							{ name: "Lena K.",   role: "Admin · Metro City",  quote: "The live map and multi-stream are game-changers. I can watch every suspect at once." },
						].map((r) => (
							<div key={r.name} className="p-5 rounded-xl flex flex-col gap-4" style={{ background: C.card, border: `1px solid ${C.subtle}` }}>
								<div className="flex gap-0.5">
									{Array.from({ length: 5 }).map((_, i) => (
										<svg key={i} className="h-3.5 w-3.5" fill={C.primary} viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									))}
								</div>
								<p className="text-sm leading-relaxed flex-1" style={{ color: C.textMuted }}>"{r.quote}"</p>
								<div>
									<p className="text-sm font-semibold" style={{ color: C.text }}>{r.name}</p>
									<p className="text-xs" style={{ color: C.muted }}>{r.role}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── FAQ ─────────────────────────────────────────────── */}
			<div style={{ borderTop: `1px solid ${C.subtle}` }}>
				<LandingFAQSection />
			</div>

			{/* ── CTA ─────────────────────────────────────────────── */}
			<section className="py-28 px-5 relative overflow-hidden" style={{ borderTop: `1px solid ${C.subtle}` }}>
				<div className="absolute inset-0 pointer-events-none landing-grid" aria-hidden>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px]" style={{ background: `radial-gradient(ellipse at center, rgba(34,211,238,0.06), transparent 70%)` }} />
				</div>
				<div className="max-w-2xl mx-auto text-center relative">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8" style={{ background: `rgba(34,211,238,0.06)`, border: C.borderAccent, color: "#67e8f9" }}>
						<Shield className="h-3.5 w-3.5" style={{ color: C.primary }} />
						Join 10+ protected servers today
					</div>
					<h2 className="font-black tracking-tight mb-5" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: C.text }}>{t("need_help.title")}</h2>
					<p className="text-base mb-10" style={{ color: C.textMuted }}>{t("need_help.subtitle")}</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<a href={DISCORD} target="_blank" rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
							style={{ background: "#5865F2", boxShadow: "0 4px 16px rgba(88,101,242,0.3)" }}>
							<DiscordIcon className="h-4 w-4" />
							{t("need_help.join_discord")}
						</a>
						<a href="#pricing"
							className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
							style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: "#d1d5db" }}>
							{t("need_help.get_started")}
							<ArrowRight className="h-4 w-4" />
						</a>
					</div>
				</div>
			</section>

			{/* ── FOOTER ──────────────────────────────────────────── */}
			<footer className="py-16 px-5" style={{ borderTop: `1px solid ${C.subtle}`, background: "rgba(0,0,0,0.25)" }}>
				<div className="max-w-6xl mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
						<div className="col-span-2 md:col-span-1">
							<Link href="/" className="flex items-center gap-2.5 mb-4 w-fit">
								<Image src="/logo.png" alt="VexonAC" width={28} height={28} style={{ objectFit: "contain" }} unoptimized />
								<span className="font-bold text-sm" style={{ color: C.text }}>VexonAC</span>
							</Link>
							<p className="text-xs leading-relaxed max-w-[180px]" style={{ color: C.muted }}>{t("footer.description")}</p>
						</div>

						{[
							{
								title: t("footer.navigation.title"),
								links: [
									{ label: t("footer.navigation.home"),     href: "#"         },
									{ label: t("footer.navigation.features"), href: "#features" },
									{ label: t("footer.navigation.pricing"),  href: "#pricing"  },
									{ label: t("footer.navigation.faqs"),     href: "#faqs"     },
									{ label: "Panel",                         href: "#panel"    },
								],
								external: false,
							},
							{
								title: t("footer.legal.title"),
								links: [
									{ label: t("footer.legal.terms"),   href: "/terms"   },
									{ label: t("footer.legal.privacy"), href: "/privacy" },
									{ label: t("footer.legal.refund"),  href: "/refund"  },
								],
								external: false,
							},
							{
								title: t("footer.support.title"),
								links: [
									{ label: t("footer.support.discord"),       href: DISCORD },
									{ label: t("footer.support.documentation"), href: "#"     },
								],
								external: true,
							},
						].map((col) => (
							<div key={col.title}>
								<p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: C.subtle }}>
									{col.title}
								</p>
								<ul className="space-y-2.5">
									{col.links.map((l) => (
										<li key={l.label}>
											{col.external ? (
												<a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
													className="text-sm transition-colors hover:text-white" style={{ color: C.muted }}>{l.label}</a>
											) : l.href.startsWith("/") ? (
												<Link href={l.href} className="text-sm transition-colors hover:text-white" style={{ color: C.muted }}>{l.label}</Link>
											) : (
												<a href={l.href} className="text-sm transition-colors hover:text-white" style={{ color: C.muted }}>{l.label}</a>
											)}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>

					<div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.subtle}` }}>
						<p className="text-xs" style={{ color: C.muted }}>© {new Date().getFullYear()} VexonAC. All rights reserved.</p>
						<a href={DISCORD} target="_blank" rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color: C.muted }}>
							<DiscordIcon className="h-3.5 w-3.5" />
							discord.gg/NrzrubrYad
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default Landing;
