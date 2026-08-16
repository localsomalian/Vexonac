"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
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

const TermsPage = () => {
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                Terms of Service
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
              Terms of Service
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Please read these terms carefully before using VexonAC services
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
                    <div className="space-y-8">
                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          1. Acceptance of Terms
                        </h2>
                        <p className="mb-3">
                          These Terms of Service ("Terms") constitute a legally binding agreement between you ("you", "user" or "licensee") and VexonAC ("we", "our", "VexonAC"), provider of Anti-Cheat System ("Product" or "Service").
                        </p>
                        <p className="mb-3">
                          By accessing or using the website, purchasing, or using the software and services provided by us, you agree to abide by these Terms. If you do not agree with these Terms, please do not access or use our Service.
                        </p>
                        <p>
                          We reserve the right to update or modify these Terms at any time. Any changes will be effective immediately upon posting on this page, and your continued use of the Service after such changes constitutes acceptance of the new Terms.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          2. Definitions
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                          <li><strong>Service:</strong> The VexonAC anti-cheat system and all associated services</li>
                          <li><strong>User:</strong> Any individual or entity using the Service</li>
                          <li><strong>License:</strong> The right of use granted for the Product</li>
                          <li><strong>Server:</strong> FiveM game server on which the Product is installed</li>
                        </ul>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          3. License Grant and Restrictions
                        </h2>
                        <p className="mb-3">
                          By purchasing and using our anti-cheat system, you are granted a non-transferable, non-exclusive, revocable license to install and use the Product on your game server(s) under the conditions outlined in these Terms.
                        </p>
                        <p className="mb-2">You may not:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Modify, decompile, reverse-engineer, or disassemble the Product in any manner</li>
                          <li>Redistribute, sell, lease, or sublicense the Product without prior written consent from VexonAC</li>
                          <li>Use the Product to create a similar anti-cheat service or software</li>
                          <li>Share, transfer, or distribute any materials provided as part of the Service without authorization</li>
                          <li>Violate any applicable laws or third-party terms of service while using the Product</li>
                        </ul>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          4. Account Management
                        </h2>
                        <p className="mb-3">
                          To use our Service, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                        </p>
                        <p>
                          You agree to provide accurate and up-to-date information during the registration process. We reserve the right to suspend or terminate your account if we find that you have provided false or misleading information.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          5. Payment Terms and Billing
                        </h2>
                        <p className="mb-3">
                          All payments for the Product must be made via the payment methods available on our site. The prices listed are in euros (€) including all applicable taxes, and payment must be made in full before you can access or use the Product.
                        </p>
                        <p className="mb-3">
                          As a French entrepreneur under VAT franchise, we do not charge VAT. An invoice will be automatically sent to you by email after your purchase.
                        </p>
                        <p>
                          By purchasing the Product, you acknowledge that the payments are final and non-refundable, except where required by law.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          6. Right of Withdrawal and Refund Policy
                        </h2>
                        <p className="mb-3">
                          In accordance with Article L221-28 of the French Consumer Code, the right of withdrawal does not apply to digital content not supplied on a tangible medium whose execution has begun after your express prior agreement and express waiver of your right of withdrawal.
                        </p>
                        <p className="mb-3">
                          By accepting these Terms and proceeding with the download of the Product, you give your express agreement for the immediate commencement of the contract performance and expressly waive your right of withdrawal.
                        </p>
                        <p>
                          All sales are final and non-refundable, except in cases of major non-conformity of the product or proven technical impossibility on our part.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          7. License Transfer and Additional Servers
                        </h2>
                        <p>
                          Each license is valid for a single server. If you wish to use the Product on multiple servers, you must purchase additional licenses for each server. Attempting to extend a license to unauthorized servers may result in termination of your license without refund.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          8. Usage Restrictions and Prohibited Activities
                        </h2>
                        <p className="mb-2">You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-1 mb-3">
                          <li>Use the Product in a manner that violates any applicable law or regulation</li>
                          <li>Circumvent or attempt to circumvent any protections or restrictions placed on the Product</li>
                          <li>Modify or tamper with the Product's code or any associated resources</li>
                          <li>Engage in fraudulent activity, such as chargebacks or attempting to scam the system</li>
                          <li>Harass, threaten, or engage in inappropriate conduct with VexonAC staff</li>
                        </ul>
                        <p>
                          Failure to comply with these restrictions may result in suspension or termination of your license.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          9. Bans and Violations
                        </h2>
                        <p className="mb-3">
                          In the event that a user is banned by our anti-cheat system, those bans are permanent and cannot be lifted. This includes bans for cheat detection or other system violations.
                        </p>
                        <p>
                          If you believe a ban is issued in error, you may contact our support team for further investigation. However, we do not reverse bans related to cheat detection under any circumstances.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          10. Liability and Warranties
                        </h2>
                        <p className="mb-3">
                          To the fullest extent permitted by law, VexonAC and its affiliates will not be held liable for any damages, losses, or expenses arising out of your use of the Product or Service, including but not limited to lost profits, loss of data, or any indirect, incidental, or consequential damages.
                        </p>
                        <p className="mb-3">
                          We do not guarantee uninterrupted or error-free service, and we are not liable for any interruptions, downtime, or other technical issues that may arise while using the Product.
                        </p>
                        <p>
                          Our liability is limited to the amount paid for the Product in the 12 months preceding the claim.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          11. Personal Data Protection
                        </h2>
                        <p className="mb-3">
                          We collect certain personal data to operate and provide the Service, in compliance with the General Data Protection Regulation (GDPR) and French Data Protection Law.
                        </p>
                        <p className="mb-3">
                          The data collected includes server information, game identifiers, and user interactions. You consent to our collection and use of this data as described in our Privacy Policy.
                        </p>
                        <p>
                          You have the right to access, rectify, erase, port, and object to your personal data, which you can exercise by contacting us at contact@vexonac.com.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          12. Intellectual Property
                        </h2>
                        <p>
                          All intellectual property rights, including but not limited to trademarks, copyrights, and patents related to the Product, are owned by VexonAC. By using our Service, you do not acquire any rights or ownership over the Product or associated intellectual property.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          13. Termination of Service
                        </h2>
                        <p className="mb-3">
                          We reserve the right to suspend or terminate your access to the Product and the Service at any time, with or without cause, and with or without notice. If your license is terminated due to a violation of these Terms, you will not be entitled to a refund.
                        </p>
                        <p>
                          Upon termination, you must cease using the Product and destroy any copies in your possession, whether in electronic or printed form.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          14. Changes to These Terms
                        </h2>
                        <p>
                          We reserve the right to modify these Terms at any time. Changes to the Terms will be posted on our website, and the updated Terms will take effect immediately upon posting. It is your responsibility to review these Terms periodically.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          15. Governing Law and Dispute Resolution
                        </h2>
                        <p className="mb-3">
                          These Terms are governed by French law. Any disputes arising from or related to these Terms will be subject to the exclusive jurisdiction of French courts.
                        </p>
                        <p className="mb-3">
                          In accordance with the provisions of the Consumer Code concerning amicable dispute resolution, VexonAC adheres to the e-commerce mediator service of FEVAD (Federation of Distance Selling and E-commerce) whose coordinates are: 60 Rue La Boétie — 75008 Paris — http://www.mediateurfevad.fr.
                        </p>
                        <p>
                          After prior written approach by consumers vis-à-vis VexonAC, the Mediator Service can be contacted for any consumer dispute whose settlement would not have been successful.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          16. General Provisions
                        </h2>
                        <p className="mb-3">
                          If any provision of these Terms is deemed invalid or unenforceable, the remaining provisions will remain in effect. The invalidity of one clause does not entail the invalidity of the entire contract.
                        </p>
                        <p>
                          These Terms constitute the entire agreement between you and VexonAC regarding the use of the Service and supersede all prior agreements relating to this subject.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          17. Contact Information
                        </h2>
                        <p className="mb-3">
                          If you have any questions or concerns about these Terms, please contact us:
                        </p>
                        <div className="bg-gray-800/30 p-4 rounded-lg">
                          <ul className="list-none space-y-1">
                            <li><strong>Email:</strong> contact@vexonac.com</li>
                            <li><strong>Website:</strong> https://vexonac.com</li>
                            <li><strong>Postal Address:</strong> Available upon request</li>
                          </ul>
                        </div>
                      </section>

                      {/* Legal Information moved to the end and made less prominent */}
                      <section className="border-t border-gray-700/50 pt-6 mt-8">
                        <h2 className="text-lg font-medium text-gray-400 mb-3">
                          Legal Information
                        </h2>
                        <div className="bg-gray-800/20 p-3 rounded text-sm text-gray-400">
                          <p className="mb-2">Service provided by:</p>
                          <ul className="list-none space-y-1 text-xs">
                            <li>Illan Demeese - Entrepreneur Individuel (EI)</li>
                            <li>Email: contact@vexonac.com</li>
                            <li>Phone: Available upon request</li>
                            <li>Business Address: Available upon request</li>
                            <li>Website: https://vexonac.com</li>
                          </ul>
                        </div>
                      </section>

                      <div className="mt-8 p-4 bg-violet-900/20 border border-violet-700/30 rounded-lg">
                        <p className="text-sm text-gray-300">
                          <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US')}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          These Terms comply with French regulations applicable to entrepreneurs and e-commerce.
                        </p>
                      </div>
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

export default TermsPage;


