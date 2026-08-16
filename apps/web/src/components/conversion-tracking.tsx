'use client'

import { useEffect } from 'react'

declare global {
	interface Window {
		gtag: (...args: any[]) => void
	}
}

export function ConversionTracking() {
	useEffect(() => {
		// Create and inject the conversion tracking script into the head
		const script = document.createElement('script')
		script.innerHTML = `
			(function() {
				function fireConversion() {
					if (typeof window.gtag === 'function') {
						gtag('event', 'conversion', {'send_to': 'AW-17355987163/czFPCMnpqPIaENux_dNA'});
					} else {
						// Retry if gtag is not loaded yet
						setTimeout(fireConversion, 100);
					}
				}
				fireConversion();
			})();
		`
		
		// Add to head
		document.head.appendChild(script)

		return () => {
			// Cleanup - remove script when component unmounts
			if (document.head.contains(script)) {
				document.head.removeChild(script)
			}
		}
	}, [])

	return null
} 