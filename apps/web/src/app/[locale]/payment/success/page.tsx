'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function PaymentSuccessPage() {
	const searchParams = useSearchParams()
	const email = searchParams.get('email')

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="w-full max-w-md"
			>
				<Card className="bg-background/80 backdrop-blur-xl border border-green-500/20 shadow-2xl">
					<CardHeader className="text-center pb-4">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
							className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
						>
							<CheckCircle className="w-8 h-8 text-white" />
						</motion.div>
						<CardTitle className="text-2xl font-bold text-white mb-2">
							Payment Successful!
						</CardTitle>
						<p className="text-gray-400">
							Your payment has been confirmed
						</p>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Email notification */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.4 }}
							className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4"
						>
							<div className="flex items-start space-x-3">
								<div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
									<Mail className="w-4 h-4 text-violet-400" />
								</div>
								<div>
									<h3 className="text-white font-semibold mb-1">Check Your Email</h3>
									<p className="text-gray-300 text-sm leading-relaxed">
										Your license key has been sent to{' '}
										{email ? (
											<span className="text-violet-400 font-medium">{email}</span>
										) : (
											<span className="text-violet-400">your email address</span>
										)}
									</p>
								</div>
							</div>
						</motion.div>

						{/* Instructions */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.6 }}
							className="space-y-3"
						>
							<h4 className="text-white font-semibold">Next Steps:</h4>
							<ol className="space-y-2 text-sm text-gray-300">
								<li className="flex items-start space-x-2">
									<span className="w-5 h-5 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
									<span>Check your email inbox (and spam folder)</span>
								</li>
								<li className="flex items-start space-x-2">
									<span className="w-5 h-5 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
									<span>Copy your license key from the email</span>
								</li>
								<li className="flex items-start space-x-2">
									<span className="w-5 h-5 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
									<span>Redeem it in your VexonAC dashboard</span>
								</li>
							</ol>
						</motion.div>

						{/* Action buttons */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.8 }}
							className="space-y-3 pt-2"
						>
							<Button
								onClick={() => window.location.href = '/dashboard/redeem'}
								className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all duration-300"
							>
								Go to Dashboard
								<ArrowRight className="w-4 h-4 ml-2" />
							</Button>
							
							<Button
								variant="outline"
								onClick={() => window.location.href = '/'}
								className="w-full border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 py-3 rounded-lg transition-all duration-300"
							>
								Back to Home
							</Button>
						</motion.div>

						{/* Support note */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 1 }}
							className="text-center pt-4 border-t border-gray-800"
						>
							<p className="text-xs text-gray-500">
								Need help? Join our{' '}
								<a
									href="https://discord.gg/NrzrubrYad"
									target="_blank"
									rel="noopener noreferrer"
									className="text-violet-400 hover:text-violet-300 underline"
								>
									Discord server
								</a>
							</p>
						</motion.div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	)
} 
