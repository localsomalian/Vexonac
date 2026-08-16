"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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

const PrivacyPage = () => {
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                Privacy Policy
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
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Learn how we collect, use, and protect your personal information
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
                    <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-300">
                        <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US')}
                      </p>
                    </div>

                    <p>
                      VexonAC ("we", "us", "our") values the privacy of our users ("you", "your") and is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal data when you visit our website https://vexonac.com and purchase anti-cheat software licenses from us.
                    </p>

                    <p>
                      By using our website, you agree to the collection and use of information in accordance with this Privacy Policy and in compliance with the General Data Protection Regulation (GDPR) and French Data Protection Law.
                    </p>

                    <div className="space-y-8">
                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          1. Data Controller Information
                        </h2>
                        <div className="bg-gray-800/30 p-4 rounded-lg">
                          <p className="mb-2"><strong>Data Controller:</strong></p>
                          <ul className="list-none space-y-1 ml-4">
                            <li>Illan Demeese - Entrepreneur Individuel (EI)</li>
                            <li>Email: contact@vexonac.com</li>
                            <li>Phone: Available upon request</li>
                            <li>Business Address: Available upon request to contact@vexonac.com</li>
                            <li>Website: https://vexonac.com</li>
                          </ul>
                        </div>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          2. Types of Personal Data We Collect
                        </h2>
                        <p className="mb-3">
                          We collect and process the following categories of personal data:
                        </p>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-white mb-2">2.1 Data You Provide Directly</h4>
                            <ul className="list-disc pl-6 space-y-1">
                              <li><strong>Identity Data:</strong> First name, last name, username</li>
                              <li><strong>Contact Data:</strong> Email address, postal address, telephone number</li>
                              <li><strong>Financial Data:</strong> Payment card details, billing address</li>
                              <li><strong>Transaction Data:</strong> Details about payments and purchases you make</li>
                              <li><strong>Communication Data:</strong> Your messages to us and our responses</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-white mb-2">2.2 Data We Collect Automatically</h4>
                            <ul className="list-disc pl-6 space-y-1">
                              <li><strong>Technical Data:</strong> IP address, browser type and version, device information, operating system</li>
                              <li><strong>Usage Data:</strong> Pages visited, time spent on website, click-through data, date and time of access</li>
                              <li><strong>Marketing Data:</strong> Your preferences in receiving marketing communications</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          3. Purposes and Legal Bases for Processing
                        </h2>
                        <p className="mb-3">
                          We process your personal data for the following purposes and legal bases under GDPR Article 6:
                        </p>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-600 text-sm">
                            <thead>
                              <tr className="bg-gray-800/50">
                                <th className="border border-gray-600 p-3 text-left">Purpose</th>
                                <th className="border border-gray-600 p-3 text-left">Legal Basis</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-600 p-3">Process your orders and deliver software licenses</td>
                                <td className="border border-gray-600 p-3">Contract performance (Article 6(1)(b))</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-600 p-3">Send order confirmations and customer support</td>
                                <td className="border border-gray-600 p-3">Contract performance (Article 6(1)(b))</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-600 p-3">Process payments and prevent fraud</td>
                                <td className="border border-gray-600 p-3">Contract performance (Article 6(1)(b)) & Legitimate interests (Article 6(1)(f))</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-600 p-3">Improve website and personalize experience</td>
                                <td className="border border-gray-600 p-3">Legitimate interests (Article 6(1)(f))</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-600 p-3">Send marketing communications</td>
                                <td className="border border-gray-600 p-3">Consent (Article 6(1)(a))</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-600 p-3">Comply with legal obligations (accounting, taxes)</td>
                                <td className="border border-gray-600 p-3">Legal obligation (Article 6(1)(c))</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          4. Data Retention Periods
                        </h2>
                        <p className="mb-3">
                          We retain your personal data for the following periods:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li><strong>Customer account data:</strong> For the duration of your account + 3 years after account closure</li>
                          <li><strong>Transaction and payment data:</strong> 10 years (French accounting obligations)</li>
                          <li><strong>Marketing communications:</strong> Until you withdraw consent or 3 years of inactivity</li>
                          <li><strong>Website analytics data:</strong> 25 months maximum</li>
                          <li><strong>Customer support communications:</strong> 5 years from last interaction</li>
                          <li><strong>Legal compliance data:</strong> As required by applicable law</li>
                        </ul>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          5. Data Security Measures
                        </h2>
                        <p className="mb-3">
                          We implement appropriate technical and organizational measures to protect your personal data:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>SSL/TLS encryption for data transmission</li>
                          <li>Encrypted storage of sensitive data</li>
                          <li>Regular security audits and vulnerability assessments</li>
                          <li>Access controls and employee training</li>
                          <li>Secure payment processing through certified providers</li>
                          <li>Regular backups with encryption</li>
                        </ul>
                        <p className="mt-3 text-sm text-gray-400">
                          While we implement strong security measures, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but we continuously work to protect your data.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          6. Cookies and Tracking Technologies
                        </h2>
                        <p className="mb-3">
                          We use cookies and similar technologies for the following purposes:
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-white">Essential Cookies (No consent required)</h4>
                            <p className="text-sm text-gray-400">Necessary for website functionality, security, and user authentication</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">Analytics Cookies (Consent required)</h4>
                            <p className="text-sm text-gray-400">Help us understand how visitors use our website to improve user experience</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">Marketing Cookies (Consent required)</h4>
                            <p className="text-sm text-gray-400">Used to deliver relevant advertisements and track campaign effectiveness</p>
                          </div>
                        </div>
                        <p className="mt-3">
                          You can manage your cookie preferences through your browser settings or our cookie consent banner.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          7. Data Sharing and Third Parties
                        </h2>
                        <p className="mb-3">
                          We do not sell your personal data. We may share your data with the following categories of recipients:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-3">
                          <li><strong>Payment processors:</strong> To process payments securely (Shopify)</li>
                          <li><strong>Cloud service providers:</strong> For hosting and data storage with appropriate safeguards</li>
                          <li><strong>Email service providers:</strong> To send transactional and marketing communications</li>
                          <li><strong>Analytics providers:</strong> To understand website usage (with pseudonymized data)</li>
                          <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
                        </ul>
                        <p>
                          All third parties are contractually bound to protect your data and use it only for specified purposes.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          8. International Data Transfers
                        </h2>
                        <p className="mb-3">
                          Some of our service providers may be located outside the European Economic Area (EEA). When we transfer your data internationally, we ensure adequate protection through:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>European Commission adequacy decisions</li>
                          <li>Standard Contractual Clauses (SCCs)</li>
                          <li>Binding Corporate Rules</li>
                          <li>Certification schemes and codes of conduct</li>
                        </ul>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          9. Your Data Protection Rights
                        </h2>
                        <p className="mb-3">
                          Under GDPR and French data protection law, you have the following rights:
                        </p>
                        
                        <div className="space-y-3">
                          <div className="bg-gray-800/30 p-3 rounded">
                            <h4 className="font-semibold text-white mb-1">Right of Access (Article 15)</h4>
                            <p className="text-sm text-gray-400">Request a copy of your personal data we hold</p>
                          </div>
                          <div className="bg-gray-800/30 p-3 rounded">
                            <h4 className="font-semibold text-white mb-1">Right to Rectification (Article 16)</h4>
                            <p className="text-sm text-gray-400">Correct inaccurate or incomplete personal data</p>
                          </div>
                          <div className="bg-gray-800/30 p-3 rounded">
                            <h4 className="font-semibold text-white mb-1">Right to Erasure (Article 17)</h4>
                            <p className="text-sm text-gray-400">Request deletion of your personal data (subject to legal obligations)</p>
                          </div>
                          <div className="bg-gray-800/30 p-3 rounded">
                            <h4 className="font-semibold text-white mb-1">Right to Restrict Processing (Article 18)</h4>
                            <p className="text-sm text-gray-400">Limit how we use your personal data</p>
                          </div>
                          <div className="bg-gray-800/30 p-3 rounded">
                            <h4 className="font-semibold text-white mb-1">Right to Data Portability (Article 20)</h4>
                            <p className="text-sm text-gray-400">Receive your data in a structured, machine-readable format</p>
                          </div>
                          <div className="bg-gray-800/30 p-3 rounded">
                            <h4 className="font-semibold text-white mb-1">Right to Object (Article 21)</h4>
                            <p className="text-sm text-gray-400">Object to processing based on legitimate interests or direct marketing</p>
                          </div>
                        </div>

                        <div className="mt-4 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                          <h4 className="font-semibold text-white mb-2">How to Exercise Your Rights</h4>
                          <p className="text-sm">
                            To exercise any of these rights, contact us at <strong>contact@vexonac.com</strong> with:
                          </p>
                          <ul className="list-disc pl-6 text-sm mt-2 space-y-1">
                            <li>Clear identification of your request</li>
                            <li>Proof of identity (for security purposes)</li>
                            <li>Specific details about the data concerned (if applicable)</li>
                          </ul>
                          <p className="text-sm mt-2">
                            <strong>Response time:</strong> We will respond within 1 month (extendable to 3 months for complex requests).
                          </p>
                        </div>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          10. Right to Lodge a Complaint
                        </h2>
                        <p className="mb-3">
                          You have the right to lodge a complaint with a supervisory authority if you believe your data protection rights have been violated:
                        </p>
                        <div className="bg-gray-800/30 p-4 rounded-lg">
                          <p><strong>French Supervisory Authority (CNIL):</strong></p>
                          <ul className="list-none space-y-1 ml-4 text-sm">
                            <li>Commission Nationale de l'Informatique et des Libertés</li>
                            <li>3 Place de Fontenoy - TSA 80715</li>
                            <li>75334 PARIS CEDEX 07</li>
                            <li>Phone: +33 (0)1 53 73 22 22</li>
                            <li>Website: https://www.cnil.fr</li>
                            <li>Online complaint: https://www.cnil.fr/en/plaintes</li>
                          </ul>
                        </div>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          11. Automated Decision-Making and Profiling
                        </h2>
                        <p>
                          We do not use automated decision-making or profiling that produces legal effects concerning you or significantly affects you. Any automated processing we use is limited to basic fraud prevention measures and website optimization.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          12. Third-Party Links
                        </h2>
                        <p>
                          Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party websites you visit.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          13. Changes to This Privacy Policy
                        </h2>
                        <p className="mb-3">
                          We may update this Privacy Policy to reflect changes in our practices or for legal, operational, or regulatory reasons. When we make material changes:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>We will post the updated policy on this page</li>
                          <li>We will update the "Last Updated" date</li>
                          <li>We will notify you via email if you have an account with us</li>
                          <li>For significant changes, we may seek your renewed consent</li>
                        </ul>
                        <p className="mt-3">
                          We encourage you to review this Privacy Policy periodically.
                        </p>
                      </section>

                      <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                          14. Contact Information
                        </h2>
                        <p className="mb-3">
                          If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                        </p>
                        <div className="bg-gray-800/30 p-4 rounded-lg">
                          <ul className="list-none space-y-1">
                            <li><strong>Email:</strong> contact@vexonac.com</li>
                            <li><strong>Subject Line:</strong> "Privacy Policy Inquiry" or "Data Protection Request"</li>
                            <li><strong>Postal Address:</strong> Available upon request</li>
                            <li><strong>Response Time:</strong> We aim to respond within 48 hours for general inquiries and within 1 month for formal data protection requests</li>
                          </ul>
                        </div>
                      </section>
                    </div>

                    <div className="mt-8 p-4 bg-violet-900/20 border border-violet-700/30 rounded-lg">
                      <p className="text-sm text-gray-300">
                        This Privacy Policy complies with the General Data Protection Regulation (GDPR), French Data Protection Act (Loi Informatique et Libertés), and other applicable data protection laws.
                      </p>
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

export default PrivacyPage;


