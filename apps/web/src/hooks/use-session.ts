"use client";

import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

// Universal session hook that works for both demo and real pages
export function useSession() {
	const pathname = usePathname();
	const isDemoPage = pathname?.includes('/server/demo');

	// Always call the auth client hook to maintain hooks order
	const realSession = authClient.useSession();

	if (isDemoPage) {
		// For demo pages, return a fake session but maintain the same hook structure
		return {
			data: {
				user: {
					id: "demo-user-123456789",
					discordId: "123456789123456789",
					username: "Demo User",
					name: "Demo User",
					image: "https://cdn.discordapp.com/embed/avatars/0.png",
				},
				expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			},
			isPending: false,
			error: null,
		};
	}

	// For real pages, return the actual auth client session
	return realSession;
} 