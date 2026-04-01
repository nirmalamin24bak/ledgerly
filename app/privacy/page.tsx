import Link from 'next/link'
import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — Ledgerly' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="border-b border-gray-200 py-4 px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="h-8 w-8 rounded-lg bg-blue-950 flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="font-semibold text-gray-900 text-[16px]">Ledgerly</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold text-gray-950 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 2025</p>

        <Section title="1. Overview">
          Ledgerly (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding it. By using Ledgerly, you agree to the practices described here.
        </Section>

        <Section title="2. Information We Collect">
          <strong className="text-gray-800">Account data:</strong> Name, email address, and password (hashed) when you register.
          <br /><br />
          <strong className="text-gray-800">Financial data you enter:</strong> Supplier details, bills, invoices, payment records, and GST/TDS information. This data belongs to you.
          <br /><br />
          <strong className="text-gray-800">Uploaded documents:</strong> Bill images and PDFs you upload for AI scanning, stored securely in encrypted cloud storage.
          <br /><br />
          <strong className="text-gray-800">Usage data:</strong> Log data including IP address, browser type, pages visited, and timestamps — used for security and improving the Service.
          <br /><br />
          <strong className="text-gray-800">Payment data:</strong> When you make a purchase, payment is processed by Razorpay. Ledgerly does not receive or store your card or banking details. Razorpay collects your name, email address, contact number, and payment method details to process the transaction. Please refer to <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline underline-offset-2">Razorpay&apos;s Privacy Policy</a> for full details.
          <br /><br />
          <strong className="text-gray-800">Communications:</strong> Emails you send us or support requests.
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and operate the Service</li>
            <li>To process bill images using AI (Anthropic Claude)</li>
            <li>To send transactional emails (verification, payment confirmations)</li>
            <li>To respond to support requests</li>
            <li>To detect and prevent fraud or abuse</li>
            <li>To improve the Service based on aggregated, anonymised usage patterns</li>
            <li>To notify you of important updates or changes to the Service</li>
          </ul>
          <p className="mt-3">We do not sell, rent, or trade your personal data to third parties.</p>
        </Section>

        <Section title="4. AI Processing">
          When you scan a bill, the document image is sent to Anthropic&apos;s Claude API for data extraction. Images are processed and not stored by Anthropic beyond the API request. The extracted data (supplier name, amounts, GST numbers, etc.) is stored in your Ledgerly account. You should not upload documents containing highly sensitive personal information unrelated to supplier invoices.
        </Section>

        <Section title="5. Data Storage and Security">
          Your data is stored on secure cloud infrastructure (Supabase/PostgreSQL with row-level security). Documents are stored in Supabase Storage with signed URLs for access. We use industry-standard encryption in transit (TLS) and at rest.
          <br /><br />
          While we take reasonable steps to protect your data, no system is completely secure. We cannot guarantee absolute security.
        </Section>

        <Section title="6. Third-Party Services">
          We use the following third-party services to operate Ledgerly:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong className="text-gray-800">Razorpay</strong> — payment processing. Razorpay is PCI-DSS compliant and bound by its own <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline underline-offset-2">Privacy Policy</a>.
            </li>
            <li><strong className="text-gray-800">Anthropic Claude</strong> — AI bill scanning and natural language queries</li>
            <li><strong className="text-gray-800">Supabase</strong> — database and file storage (encrypted at rest)</li>
            <li><strong className="text-gray-800">Vercel</strong> — hosting</li>
          </ul>
          <p className="mt-3">We only share the minimum data necessary for each service to function. We do not sell your data to any third party.</p>
        </Section>

        <Section title="7. Cookies">
          Ledgerly uses cookies and session storage to maintain your login session and preferences. We do not use tracking or advertising cookies. You can disable cookies in your browser, but this may affect functionality.
        </Section>

        <Section title="8. Data Retention">
          We retain your data for as long as your account is active. If you delete your account, your data is retained for 30 days (for recovery purposes) and then permanently deleted. You may request immediate deletion by contacting us.
        </Section>

        <Section title="9. Your Rights">
          Depending on your location, you may have the right to:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Access a copy of the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability (export your data)</li>
          </ul>
          To exercise any of these rights, email us at <a href="mailto:support@yourledgerly.com" className="text-blue-800 underline underline-offset-2">support@yourledgerly.com</a>.
        </Section>

        <Section title="10. Children's Privacy">
          Ledgerly is not intended for users under 18 years of age. We do not knowingly collect personal information from minors.
        </Section>

        <Section title="11. Changes to This Policy">
          We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notice. Continued use of the Service after changes constitutes acceptance.
        </Section>

        <Section title="12. Contact">
          For privacy-related questions or requests, contact us at <a href="mailto:support@yourledgerly.com" className="text-blue-800 underline underline-offset-2">support@yourledgerly.com</a>.
        </Section>
      </main>

      <footer className="border-t border-gray-200 py-6 px-6 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-700 transition-colors font-medium text-gray-600">Privacy</Link>
          <Link href="/refund" className="hover:text-gray-700 transition-colors">Refund Policy</Link>
        </div>
        © {new Date().getFullYear()} Ledgerly. All rights reserved.
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="text-gray-500 leading-relaxed text-sm">{children}</div>
    </section>
  )
}
