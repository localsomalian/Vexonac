'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
	AlertTriangle,
	CheckCircle2,
	Circle,
	Clock,
	Eye,
	Flame,
	Plus,
	Search,
	Zap,
} from 'lucide-react'

import { ContentLayout } from '@/components/content-layout'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { trpc, queryClient } from '@/utils/trpc'

// Impact values that match the backend schema
type IncidentImpact = 'critical' | 'major' | 'minor' | 'none'
type CreateStatus = 'investigating' | 'identified' | 'monitoring'
type IncidentStatus = CreateStatus | 'resolved'

const IMPACT_CONFIG: Record<IncidentImpact, { label: string; badgeClass: string; borderClass: string }> = {
	critical: {
		label: 'Critical',
		badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
		borderClass: 'border-l-red-500',
	},
	major: {
		label: 'Major',
		badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
		borderClass: 'border-l-orange-500',
	},
	minor: {
		label: 'Minor',
		badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
		borderClass: 'border-l-yellow-500',
	},
	none: {
		label: 'Maintenance',
		badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
		borderClass: 'border-l-blue-500',
	},
}

const STATUS_CONFIG: Record<IncidentStatus, { label: string; dot: string }> = {
	investigating: { label: 'Investigating', dot: 'bg-red-400' },
	identified:    { label: 'Identified',    dot: 'bg-orange-400' },
	monitoring:    { label: 'Monitoring',    dot: 'bg-blue-400' },
	resolved:      { label: 'Resolved',      dot: 'bg-green-400' },
}

const CREATE_STATUS_OPTIONS: { value: CreateStatus; label: string; dotClass: string; activeClass: string }[] = [
	{ value: 'investigating', label: 'Investigating', dotClass: 'bg-red-400',    activeClass: 'border-red-500/60 bg-red-500/10 text-red-400' },
	{ value: 'identified',    label: 'Identified',    dotClass: 'bg-orange-400', activeClass: 'border-orange-500/60 bg-orange-500/10 text-orange-400' },
	{ value: 'monitoring',    label: 'Monitoring',    dotClass: 'bg-blue-400',   activeClass: 'border-blue-500/60 bg-blue-500/10 text-blue-400' },
]

export default function IncidentsPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const { data: isAdmin } = useQuery(trpc.adminAuth.isAdmin.queryOptions())

	const [sheetOpen, setSheetOpen] = useState(false)
	const [activeTab, setActiveTab] = useState('all')

	const [formTitle, setFormTitle] = useState('')
	const [formStatus, setFormStatus] = useState<CreateStatus>('investigating')
	const [formImpact, setFormImpact] = useState<IncidentImpact>('minor')
	const [formMessage, setFormMessage] = useState('')
	const [formNotify, setFormNotify] = useState(true)

	// Fetch incidents from the real backend
	const { data: statusData, isLoading } = useQuery(
		trpc.status.getPublic.queryOptions()
	)

	const activeIncidents = statusData?.activeIncidents ?? []
	const recentResolved  = statusData?.recentResolved  ?? []
	const allIncidents    = [...activeIncidents, ...recentResolved]

	useEffect(() => {
		if (searchParams.get('add') === 'true' && isAdmin) setSheetOpen(true)
	}, [searchParams, isAdmin])

	const openSheet = () => {
		setSheetOpen(true)
		router.replace('?add=true', { scroll: false })
	}

	const closeSheet = () => {
		setSheetOpen(false)
		router.replace('?', { scroll: false })
		setFormTitle('')
		setFormStatus('investigating')
		setFormImpact('minor')
		setFormMessage('')
		setFormNotify(true)
	}

	const createMutation = useMutation(
		trpc.status.createIncident.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.status.getPublic.queryOptions())
				closeSheet()
				toast.success('Incident created and published to status page')
			},
			onError: (err: any) => {
				toast.error(err.message ?? 'Failed to create incident')
			},
		})
	)

	const resolveMutation = useMutation(
		trpc.status.addIncidentUpdate.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.status.getPublic.queryOptions())
				toast.success('Incident resolved')
			},
			onError: (err: any) => {
				toast.error(err.message ?? 'Failed to resolve incident')
			},
		})
	)

	const handleSubmit = () => {
		if (!formTitle.trim()) return toast.error('Incident title is required')
		if (!formMessage.trim()) return toast.error('Update message is required')

		createMutation.mutate({
			title: formTitle.trim(),
			impact: formImpact,
			status: formStatus,
			message: formMessage.trim(),
		})
	}

	const resolveIncident = (id: string) => {
		resolveMutation.mutate({
			incidentId: id,
			status: 'resolved',
			message: 'This incident has been resolved.',
		})
	}

	const tabIncidents =
		activeTab === 'all'     ? allIncidents :
		activeTab === 'ongoing' ? activeIncidents :
		recentResolved

	const ongoingCount = activeIncidents.length
	const resolvedCount = recentResolved.length
	const criticalCount = allIncidents.filter(i => i.impact === 'critical').length

	return (
		<ContentLayout title='Incidents'>
			{/* Header */}
			<div className='flex items-center justify-between gap-4'>
				<div>
					<h1 className='text-xl font-semibold tracking-tight'>Incidents</h1>
					<p className='text-sm text-muted-foreground mt-0.5'>
						Track and communicate service disruptions to your users.
					</p>
				</div>
				{isAdmin && (
					<button
						onClick={openSheet}
						className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors'
					>
						<Plus className='h-4 w-4' />
						New incident
					</button>
				)}
			</div>

			{/* Summary bar */}
			{!isLoading && allIncidents.length > 0 && (
				<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
					{[
						{ label: 'Total',    value: allIncidents.length,  icon: <Circle className='h-4 w-4' />,       cls: 'text-muted-foreground' },
						{ label: 'Ongoing',  value: ongoingCount,          icon: <AlertTriangle className='h-4 w-4' />, cls: ongoingCount > 0 ? 'text-orange-400' : 'text-muted-foreground' },
						{ label: 'Resolved', value: resolvedCount,         icon: <CheckCircle2 className='h-4 w-4' />, cls: 'text-green-400' },
						{ label: 'Critical', value: criticalCount,         icon: <Flame className='h-4 w-4' />,        cls: 'text-red-400' },
					].map(stat => (
						<div key={stat.label} className='rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3'>
							<div className={cn('shrink-0', stat.cls)}>{stat.icon}</div>
							<div>
								<p className='text-xl font-bold leading-none'>{stat.value}</p>
								<p className='text-xs text-muted-foreground mt-1'>{stat.label}</p>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='h-9'>
					<TabsTrigger value='all' className='text-xs px-4'>
						All
						{allIncidents.length > 0 && <span className='ml-1.5 text-[10px] font-medium opacity-60'>{allIncidents.length}</span>}
					</TabsTrigger>
					<TabsTrigger value='ongoing' className='text-xs px-4'>
						Ongoing
						{ongoingCount > 0 && <span className='ml-1.5 text-[10px] font-medium text-orange-400'>{ongoingCount}</span>}
					</TabsTrigger>
					<TabsTrigger value='resolved' className='text-xs px-4'>
						Resolved
						{resolvedCount > 0 && <span className='ml-1.5 text-[10px] font-medium opacity-60'>{resolvedCount}</span>}
					</TabsTrigger>
				</TabsList>

				{(['all', 'ongoing', 'resolved'] as const).map(tab => (
					<TabsContent key={tab} value={tab} className='mt-3'>
						{isLoading ? (
							<div className='space-y-2'>
								{[1, 2, 3].map(i => (
									<div key={i} className='rounded-xl border border-white/[0.07] bg-white/[0.02] h-20 animate-pulse' />
								))}
							</div>
						) : tabIncidents.length === 0 ? (
							<EmptyState tab={tab} onAdd={isAdmin ? openSheet : undefined} />
						) : (
							<div className='space-y-2'>
								{tabIncidents.map((incident: any) => (
									<IncidentRow
										key={incident.id}
										incident={incident}
										onResolve={isAdmin ? () => resolveIncident(incident.id) : undefined}
									/>
								))}
							</div>
						)}
					</TabsContent>
				))}
			</Tabs>

			{/* Create Incident Sheet (admin only) */}
			{isAdmin && (
				<Sheet open={sheetOpen} onOpenChange={open => !open && closeSheet()}>
					<SheetContent className='sm:max-w-[480px] overflow-y-auto p-0 gap-0 border-l border-white/[0.08] bg-background' side='right'>
						<SheetHeader className='px-6 py-5 border-b border-white/[0.06]'>
							<SheetTitle className='text-base font-semibold'>Create new incident</SheetTitle>
							<p className='text-sm text-muted-foreground'>
								Report a service disruption. It will appear on the public status page immediately.
							</p>
						</SheetHeader>

						<div className='flex flex-col gap-5 px-6 py-5'>
							{/* Title */}
							<div className='space-y-2'>
								<Label htmlFor='incident-title' className='text-sm font-medium'>
									Title <span className='text-red-400'>*</span>
								</Label>
								<Input
									id='incident-title'
									placeholder='e.g. API latency issues'
									value={formTitle}
									onChange={e => setFormTitle(e.target.value)}
									className='border-white/[0.07] bg-white/[0.02] focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20'
								/>
							</div>

							{/* Status */}
							<div className='space-y-2.5'>
								<Label className='text-sm font-medium'>
									Status <span className='text-red-400'>*</span>
								</Label>
								<div className='grid grid-cols-3 gap-2'>
									{CREATE_STATUS_OPTIONS.map(opt => (
										<button
											key={opt.value}
											type='button'
											onClick={() => setFormStatus(opt.value)}
											className={cn(
												'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all text-xs font-medium',
												formStatus === opt.value
													? opt.activeClass
													: 'border-white/[0.07] text-muted-foreground hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-foreground'
											)}
										>
											<span className={cn('h-2 w-2 rounded-full shrink-0', opt.dotClass)} />
											{opt.label}
										</button>
									))}
								</div>
							</div>

							{/* Impact */}
							<div className='space-y-2'>
								<Label className='text-sm font-medium'>Impact</Label>
								<Select value={formImpact} onValueChange={v => setFormImpact(v as IncidentImpact)}>
									<SelectTrigger className='border-white/[0.07] bg-white/[0.02]'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[
											{ value: 'minor',    label: 'Minor',       dot: 'bg-yellow-400' },
											{ value: 'major',    label: 'Major',       dot: 'bg-orange-400' },
											{ value: 'critical', label: 'Critical',    dot: 'bg-red-400' },
											{ value: 'none',     label: 'Maintenance', dot: 'bg-blue-400' },
										].map(opt => (
											<SelectItem key={opt.value} value={opt.value}>
												<div className='flex items-center gap-2'>
													<span className={cn('h-2 w-2 rounded-full', opt.dot)} />
													{opt.label}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Message */}
							<div className='space-y-2'>
								<Label htmlFor='incident-message' className='text-sm font-medium'>
									Message <span className='text-red-400'>*</span>
								</Label>
								<Textarea
									id='incident-message'
									placeholder="We're currently investigating an issue with..."
									value={formMessage}
									onChange={e => setFormMessage(e.target.value)}
									className='min-h-[90px] resize-none border-white/[0.07] bg-white/[0.02] focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20'
								/>
							</div>

							{/* Notify (UI only — subscriber infra can be wired up later) */}
							<div className='flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3'>
								<div>
									<p className='text-sm font-medium'>Notify subscribers</p>
									<p className='text-xs text-muted-foreground mt-0.5'>Send email / webhook to all subscribers</p>
								</div>
								<Switch
									checked={formNotify}
									onCheckedChange={setFormNotify}
									className='data-[state=checked]:bg-blue-600'
								/>
							</div>
						</div>

						<SheetFooter className='px-6 pb-6 pt-0 flex-row gap-2 border-t border-white/[0.06] mt-2 pt-4'>
							<button
								onClick={closeSheet}
								className='flex-1 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors'
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={createMutation.isPending}
								className='flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-60'
							>
								{createMutation.isPending ? 'Publishing…' : 'Create incident'}
							</button>
						</SheetFooter>
					</SheetContent>
				</Sheet>
			)}
		</ContentLayout>
	)
}

function IncidentRow({ incident, onResolve }: { incident: any; onResolve?: () => void }) {
	const impact = IMPACT_CONFIG[incident.impact as IncidentImpact] ?? IMPACT_CONFIG.minor
	const status = STATUS_CONFIG[incident.status as IncidentStatus] ?? STATUS_CONFIG.investigating
	const isResolved = incident.status === 'resolved'

	const latestUpdate = incident.updates?.[0]

	return (
		<div className={cn(
			'rounded-xl border border-border/40 hover:border-border/60 bg-card hover:bg-card/80 border-l-2 pl-4 pr-5 py-4 flex items-start gap-4 transition-all',
			impact.borderClass
		)}>
			<div className={cn('mt-0.5 h-2.5 w-2.5 rounded-full shrink-0', status.dot)} />

			<div className='flex-1 min-w-0'>
				<div className='flex items-start gap-3 flex-wrap'>
					<p className='text-sm font-semibold leading-snug flex-1 min-w-0'>{incident.title}</p>
					<div className='flex items-center gap-2 flex-wrap'>
						<Badge variant='outline' className={cn('text-[11px] px-2 py-0.5 font-medium', impact.badgeClass)}>
							{impact.label}
						</Badge>
						<Badge variant='outline' className={cn(
							'text-[11px] px-2 py-0.5 font-medium',
							isResolved
								? 'bg-green-500/10 text-green-400 border-green-500/20'
								: 'bg-white/[0.04] text-muted-foreground border-white/[0.08]'
						)}>
							{status.label}
						</Badge>
					</div>
				</div>

				<div className='flex items-center gap-4 mt-2 flex-wrap'>
					<span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
						<Clock className='h-3 w-3' />
						{isResolved && incident.resolvedAt
							? `Resolved ${formatDistanceToNow(new Date(incident.resolvedAt), { addSuffix: true })}`
							: `Started ${formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}`}
					</span>
					{!isResolved && (
						<span className='text-xs text-orange-400 flex items-center gap-1'>
							<span className='h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse' />
							Ongoing
						</span>
					)}
				</div>

				{latestUpdate?.message && (
					<p className='text-xs text-muted-foreground/60 mt-2 line-clamp-1'>
						{latestUpdate.message}
					</p>
				)}
			</div>

			{!isResolved && onResolve && (
				<button
					onClick={onResolve}
					className='shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-colors'
				>
					<CheckCircle2 className='h-3 w-3' />
					Resolve
				</button>
			)}
		</div>
	)
}

function EmptyState({ tab, onAdd }: { tab: string; onAdd?: () => void }) {
	const isResolved = tab === 'resolved'
	const isOngoing  = tab === 'ongoing'

	return (
		<div className='rounded-xl border border-dashed border-border/50 bg-card/30 flex flex-col items-center justify-center py-16 text-center'>
			<div className='h-12 w-12 rounded-xl border border-dashed border-border/50 flex items-center justify-center mb-4'>
				{isResolved
					? <CheckCircle2 className='h-5 w-5 text-muted-foreground/40' />
					: isOngoing
					? <AlertTriangle className='h-5 w-5 text-muted-foreground/40' />
					: <Zap className='h-5 w-5 text-muted-foreground/40' />}
			</div>
			<p className='text-sm font-medium text-foreground/70'>
				{isResolved ? 'No resolved incidents' : isOngoing ? 'No ongoing incidents' : 'No incidents yet'}
			</p>
			<p className='text-xs text-muted-foreground mt-1 mb-5 max-w-xs'>
				{isResolved
					? 'Resolved incidents will appear here once closed.'
					: isOngoing
					? 'Great news — no active incidents right now.'
					: 'Create your first incident to start communicating with your users.'}
			</p>
			{!isResolved && !isOngoing && onAdd && (
				<button
					onClick={onAdd}
					className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors'
				>
					<Plus className='h-3.5 w-3.5' />
					New incident
				</button>
			)}
		</div>
	)
}
