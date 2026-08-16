"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

// Animated grid background component matching landing page
const AnimatedGridBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-violet-950/20 to-background" />

      {/* Animated grid pattern */}
      <motion.div
        className="absolute inset-0 opacity-15 md:opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.4) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Additional grid lines */}
      <div
        className="absolute inset-0 opacity-5 md:opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial spotlight effects */}
      <div className="absolute top-0 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
    </div>
  );
};

const RefundPage = () => {
  return (
    <div className="min-h-screen bg-background text-white relative overflow-x-hidden">
      <AnimatedGridBackground />

      {/* Header */}
      <div className="relative z-10 pt-8 pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <Link href="/">
              <Button
                variant="outline"
                className="border-gray-700 hover:border-gray-600 bg-background/50 backdrop-blur-sm cursor-pointer"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-600 to-red-500 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                Refund Policy
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Refund Policy
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Understanding our refund procedures and guidelines for VexonAC
              services
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-background/50 border-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                <div className="prose prose-invert max-w-none space-y-6">
                  <div className="text-gray-300 leading-relaxed space-y-6">
                    <p>
                      This Refund Policy outlines our procedures and guidelines
                      regarding refunds for VexonAC anti-cheat services. By
                      purchasing our products, you acknowledge and agree to this
                      policy.
                    </p>

                    <div className="space-y-8">
                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          1. No-Refund Policy
                        </h2>
                        <p className="mb-3">
                          As outlined in our Terms of Service (Section 4), given
                          the nature of digital software and services:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>
                            All purchases of VexonAC licenses are final and
                            non-refundable.
                          </li>
                          <li>
                            By purchasing our service, you waive your right of
                            withdrawal as a consumer, in accordance with
                            applicable laws.
                          </li>
                          <li>
                            Once a license key has been delivered, no refunds
                            will be processed regardless of usage.
                          </li>
                        </ul>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          2. Reasoning for No-Refund Policy
                        </h2>
                        <p>
                          Our no-refund policy exists because VexonAC is a
                          digital product that cannot be returned once
                          delivered. Additionally, due to the nature of
                          anti-cheat software, allowing refunds could
                          potentially be exploited by individuals seeking to
                          examine our systems temporarily without commitment.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          3. Technical Support
                        </h2>
                        <p>
                          While we do not offer refunds, we are committed to
                          providing comprehensive technical support to ensure
                          our service functions correctly on your server. If you
                          encounter any issues with installation, configuration,
                          or operation of VexonAC, our support team is
                          available to assist you via our Discord server.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          4. License Transfers
                        </h2>
                        <p>
                          Instead of refunds, we may, at our sole discretion,
                          allow for license transfers between servers. Please
                          note that each license is valid for a single server
                          only, and attempting to use a license on multiple
                          servers simultaneously violates our Terms of Service
                          and may result in license termination.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          5. Billing Errors or Unauthorized Charges
                        </h2>
                        <p>
                          In cases of billing errors, duplicate charges, or
                          unauthorized purchases, please contact us immediately
                          at contact@vexonac.com with evidence of the
                          error. Such cases will be reviewed individually, and
                          appropriate action will be taken according to
                          applicable laws and payment processor policies.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          6. Evaluation Before Purchase
                        </h2>
                        <p>
                          We encourage all potential customers to thoroughly
                          review our service offerings, system requirements, and
                          compatibility information before making a purchase.
                          Join our Discord community to ask questions and get a
                          clear understanding of our product before buying.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          7. Force Majeure
                        </h2>
                        <p>
                          VexonAC will not be liable for any failure or delay
                          in performance resulting from causes beyond our
                          reasonable control, including but not limited to acts
                          of God, natural disasters, pandemic, war, terrorism,
                          riots, embargoes, acts of civil or military
                          authorities, fire, floods, accidents, network
                          infrastructure failures, strikes, or shortages of
                          transportation facilities, fuel, energy, labor, or
                          materials.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          8. Contact Information
                        </h2>
                        <p>
                          If you have questions about this Refund Policy or need
                          to discuss a specific purchase situation, please
                          contact us at contact@vexonac.com or through our
                          Discord server at https://discord.gg/NrzrubrYad.
                        </p>
                      </section>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;


