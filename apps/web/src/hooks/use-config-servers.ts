import { useMemo } from 'react'
import { trpc } from '@/utils/trpc'
import { useQuery } from '@tanstack/react-query'
import { hasPermission } from '@/lib/utils'
import type { Permission } from '@vexonac/database'

export interface ConfigServer {
	id: string
	serverName: string
	bannerUrl?: string
	isOwner: boolean
	permissions: Permission[]
}

export function useConfigServers() {
	const { data: userServers, isLoading } = useQuery(
		trpc.users.getUserServersList.queryOptions('all', {
			staleTime: 30000,
		})
	)

	const configServers = useMemo(() => {
		if (!userServers) return []

		return userServers.filter((server) => {
			// Owner always has configuration access
			if (server.isOwner) return true

			// Check if user has CONFIGURATION permission or ALL permissions
			if (server.permissions && Array.isArray(server.permissions)) {
				const permissions = server.permissions.map((p) => String(p)) as Permission[]
				return (
					hasPermission(permissions, 'CONFIGURATION') ||
					hasPermission(permissions, 'ALL')
				)
			}

			return false
		}) as ConfigServer[]
	}, [userServers])

	return {
		configServers,
		isLoading,
		hasConfigServers: configServers.length > 0,
	}
} 
