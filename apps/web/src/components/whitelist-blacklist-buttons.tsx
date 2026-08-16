"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useConfigServers, type ConfigServer } from '@/hooks/use-config-servers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'
import { Ban, Check, CheckCheck, Loader2, Shield, ShieldAlert } from 'lucide-react'
import { formatServerName } from '@/components/format-server-name'
import { useScopedI18n } from '@/locales/client'

export interface Model {
	name: string
	type: 'vehicle' | 'ped' | 'weapon' | 'object' | 'explosion'
	hash: string | number // number for explosions, string for others
}

interface WhitelistBlacklistButtonsProps {
	model: Model
	disabled?: boolean
}

type ListType = 'whitelist' | 'blacklist'

interface ActionDialogProps {
	isOpen: boolean
	onClose: () => void
	model: Model
	listType: ListType
	configServers: ConfigServer[]
	onConfirm: (serverId: string) => void
	isLoading?: boolean
}

function ActionDialog({
	isOpen,
	onClose,
	model,
	listType,
	configServers,
	onConfirm,
	isLoading = false,
}: ActionDialogProps) {
	const t = useScopedI18n('models')
	const [selectedServerId, setSelectedServerId] = useState<string>('')

	const handleConfirm = () => {
		if (selectedServerId) {
			onConfirm(selectedServerId)
		}
	}

	const getConfigKey = () => {
		switch (model.type) {
			case 'vehicle':
				return listType === 'whitelist' ? 'WhiteListedVehicles' : 'BlackListedVehicles'
			case 'ped':
				return listType === 'whitelist' ? 'WhiteListedPeds' : 'BlackListedPeds'
			case 'object':
				return listType === 'whitelist' ? 'WhiteListedObjects' : 'BlackListedObjects'
			case 'weapon':
				return 'BlackListedWeapons' // weapons only have blacklist
			default:
				return ''
		}
	}

	const getActionTitle = () => {
		const action = listType === 'whitelist' ? 'Whitelist' : 'Blacklist'
		return `${action} ${model.name}`
	}

	const getActionDescription = () => {
		const action = listType === 'whitelist' ? 'whitelist' : 'blacklist'
		const section = model.type === 'weapon' ? 'Weapons' : 'Entities'
		return `This will add "${model.name}" to the ${action} in the ${section} configuration section of the selected server.`
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="w-[95vw] max-w-md mx-auto">
				<DialogHeader className="space-y-3">
					<DialogTitle className="flex items-center gap-2 text-lg">
						{listType === 'whitelist' ? (
							<Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
						) : (
							<Ban className="h-5 w-5 text-red-600 flex-shrink-0" />
						)}
						<span className="leading-tight">{getActionTitle()}</span>
					</DialogTitle>
					<DialogDescription className="text-sm leading-relaxed">
						{getActionDescription()}
					</DialogDescription>
					
					{/* Model info - stacked on mobile, horizontal on larger screens */}
					<div className="space-x-2 md:space-x-0 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2 text-xs">
						<Badge variant="outline" className="font-mono text-xs break-all">
							{model.name}
						</Badge>
						<Badge variant="secondary" className="text-xs">{model.type}</Badge>
						<Badge variant="outline" className="font-mono text-xs break-all sm:hidden">
							{model.hash}
						</Badge>
						<Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex">
							{model.hash}
						</Badge>
					</div>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Select Server</label>
						<Select value={selectedServerId} onValueChange={setSelectedServerId}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Choose a server..." />
							</SelectTrigger>
							<SelectContent>
								{configServers.map((server) => (
									<SelectItem key={server.id} value={server.id}>
										<div className="flex items-center gap-2 min-w-0 w-full">
											<span className="truncate flex-1">{formatServerName(server.serverName)}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
					<Button 
						variant="outline" 
						onClick={onClose} 
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={!selectedServerId || isLoading}
						variant={listType === 'whitelist' ? 'default' : 'destructive'}
						className="w-full sm:w-auto"
					>
						{isLoading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : listType === 'whitelist' ? (
							<Shield className="mr-2 h-4 w-4" />
						) : (
							<Ban className="mr-2 h-4 w-4" />
						)}
						<span className="truncate">
							{listType === 'whitelist' ? 'Add to Whitelist' : 'Add to Blacklist'}
						</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export function WhitelistBlacklistButtons({ model, disabled = false }: WhitelistBlacklistButtonsProps) {
	const { configServers, hasConfigServers } = useConfigServers()
	const [dialogState, setDialogState] = useState<{
		isOpen: boolean
		listType: ListType | null
	}>({
		isOpen: false,
		listType: null,
	})
	const queryClient = useQueryClient()

	const updateConfigMutation = useMutation(
		trpc.servers.setConfig.mutationOptions({
			onSuccess: (_, variables) => {
				const action = dialogState.listType === 'whitelist' ? 'whitelisted' : 'blacklisted'
				const server = configServers.find((s) => s.id === variables.serverId)
				const serverName = server?.serverName || 'server'
				
				toast.success(`${model.name} ${action} successfully`, {
					description: `Added to ${serverName}`,
				})

				// Invalidate server config to refresh any config pages
				queryClient.invalidateQueries({
					queryKey: ['serverConfig', variables.serverId],
				})

				closeDialog()
			},
			onError: (error: any) => {
				if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
					const action = dialogState.listType === 'whitelist' ? 'whitelist' : 'blacklist'
					toast.warning(`${model.name} is already in the ${action}`, {
						description: 'This item has already been added to the list.',
					})
				} else {
					toast.error('Failed to update configuration', {
						description: error.message || 'An unexpected error occurred.',
					})
				}
				closeDialog()
			},
		})
	)

	const openDialog = (listType: ListType) => {
		if (!hasConfigServers) {
			toast.error('No servers available', {
				description: 'You need configuration permissions on at least one server.',
			})
			return
		}

		setDialogState({ isOpen: true, listType })
	}

	const closeDialog = () => {
		setDialogState({ isOpen: false, listType: null })
	}

	const handleAction = async (serverId: string) => {
		if (!dialogState.listType) return

		try {
			// Get current server config first
			const serverConfig = await queryClient.fetchQuery(
				trpc.servers.getConfig.queryOptions(serverId)
			)

			const actualConfig = (serverConfig as any).configuration || serverConfig
			const configKey = getConfigKey(model.type, dialogState.listType)
			
			// Determine category and value based on model type
			let categoryKey: string
			let valueToAdd: string | number
			let valueToCheck: string | number
			
			if (model.type === 'explosion') {
				categoryKey = 'Explosions'
				valueToAdd = model.hash as number
				valueToCheck = model.hash as number
			} else if (model.type === 'weapon') {
				categoryKey = 'Weapons'
				valueToAdd = model.name
				valueToCheck = model.name
			} else {
				categoryKey = 'Entities'
				valueToAdd = model.name
				valueToCheck = model.name
			}

			// Get current list and ensure it's an array
			const currentListRaw = actualConfig[categoryKey]?.[configKey]?.value
			const currentList = Array.isArray(currentListRaw) ? currentListRaw : []

			// Check if item already exists
			if (currentList.includes(valueToCheck)) {
				const action = dialogState.listType === 'whitelist' ? 'whitelist' : 'blacklist'
				toast.warning(`${model.name} is already in the ${action}`, {
					description: 'This item has already been added to the list.',
				})
				closeDialog()
				return
			}

			// Create updated raw configuration (values only, no metadata)
			const updatedRawConfig = {
				...actualConfig,
				[categoryKey]: {
					...actualConfig[categoryKey],
					[configKey]: {
            ...actualConfig[categoryKey][configKey],
            value: [...currentList, valueToAdd]
          }
        },
			}

      const configValues: Record<string, any> = {};

      for (const category in updatedRawConfig) {
        if (updatedRawConfig.hasOwnProperty(category)) {
          const categoryConfig = (updatedRawConfig as any)[category];
          configValues[category] = {};

          for (const key in categoryConfig) {
            if (categoryConfig.hasOwnProperty(key)) {
              configValues[category][key] = categoryConfig[key].value;
            }
          }
        }
      }

			// Update the configuration
			await updateConfigMutation.mutateAsync({
				serverId,
				configuration: configValues,
			})
		} catch (error) {
			console.error('Error updating config:', error)
			toast.error('Failed to update configuration')
			closeDialog()
		}
	}

	const getConfigKey = (type: string, listType: ListType) => {
		switch (type) {
			case 'vehicle':
				return listType === 'whitelist' ? 'WhiteListedVehicles' : 'BlackListedVehicles'
			case 'ped':
				return listType === 'whitelist' ? 'WhiteListedPeds' : 'BlackListedPeds'
			case 'object':
				return listType === 'whitelist' ? 'WhiteListedObjects' : 'BlackListedObjects'
			case 'weapon':
				return 'BlackListedWeapons'
			case 'explosion':
				return 'BlackListedExplosions'
			default:
				return ''
		}
	}

	// Don't show buttons if user has no config servers
	if (!hasConfigServers) {
		return null
	}

	const showWhitelist = model.type !== 'weapon' && model.type !== 'explosion'
	const showBlacklist = true

	return (
		<div className="flex items-center gap-1 w-full">
			{showWhitelist && (
				<Button
					size="sm"
					variant="outline"
					onClick={() => openDialog('whitelist')}
					disabled={disabled}
					className="h-6 px-1.5 text-xs flex-1 min-w-0"
					title={`Add ${model.name} to whitelist`}
				>
					<CheckCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
					<span className="hidden sm:inline ml-1 truncate">Whitelist</span>
				</Button>
			)}

			{showBlacklist && (
				<Button
					size="sm"
					variant="outline"
					onClick={() => openDialog('blacklist')}
					disabled={disabled}
					className="h-6 px-1.5 text-xs flex-1 min-w-0"
					title={`Add ${model.name} to blacklist`}
				>
					<Ban className="h-3 w-3 text-red-600 flex-shrink-0" />
					<span className="hidden sm:inline ml-1 truncate">Blacklist</span>
				</Button>
			)}

			{dialogState.isOpen && dialogState.listType && (
				<ActionDialog
					isOpen={dialogState.isOpen}
					onClose={closeDialog}
					model={model}
					listType={dialogState.listType}
					configServers={configServers}
					onConfirm={handleAction}
					isLoading={updateConfigMutation.isPending}
				/>
			)}
		</div>
	)
} 