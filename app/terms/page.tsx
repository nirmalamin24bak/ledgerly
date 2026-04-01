import Link from 'next/link'
import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — Ledgerly' }

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-950 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 2025</p>

        <Section title="1. Acceptance of Terms">
          By creating an account or using Ledgerly (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </Section>

        <Section title="2. Description of Service">
          Ledgerly is a cloud-based financial management platform designed for businesses and individuals to manage supplier bills, payments, GST records, TDS tracking, and related financial data. The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
        </Section>

        <Section title="3. Account Registration">
          You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must be at least 18 years old to use the Service.
        </Section>

        <Section title="4. Acceptable Use">
          You agree not to:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Upload false, misleading, or fraudulent financial data</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorised access to any part of the Service or other users&apos; data</li>
            <li>Transmit malicious code, spam, or harmful content</li>
            <li>Resell or sublicense access to the Service without our written consent</li>
            <li>Scrape or harvest data from the Service</li>
          </ul>
        </Section>

        <Section title="5. Intellectual Property">
          All content, features, and functionality of the Service — including software, text, graphics, and logos — are owned by Ledgerly and protected by applicable intellectual property laws. You retain ownership of all financial data you input into the Service.
        </Section>

        <Section title="6. AI Features">
          Ledgerly uses AI (powered by Anthropic&apos;s Claude) for bill scanning and natural language queries. While we strive for accuracy, AI-extracted data may contain errors. You are responsible for reviewing and verifying all extracted information before relying on it for financial, tax, or legal purposes.
        </Section>

        <Section title="7. Data and Privacy">
          Your use of the Service is also governed by our <Link href="/privacy" className="text-blue-800 underline underline-offset-2">Privacy Policy</Link>. By using the Service, you consent to the collection and use of your information as described therein.
        </Section>

        <Section title="8. Payments and Subscriptions">
          Paid plans are billed in advance on a monthly basis. All fees are non-refundable except as described in our <Link href="/refund" className="text-blue-800 underline underline-offset-2">Refund Policy</Link>. We reserve the right to change pricing with 30 days&apos; notice.
        </Section>

        <Section title="9. Termination">
          We may suspend or terminate your account at any time if you violate these Terms. You may close your account at any time from the Settings page. Upon termination, your data will be retained for 30 days and then permanently deleted.
        </Section>

        <Section title="10. Limitation of Liability">
          To the maximum extent permitted by law, Ledgerly shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months preceding the claim.
        </Section>

        <Section title="11. Disclaimer of Warranties">
          The Service is provided without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
        </Section>

        <Section title="12. Governing Law">
          These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.
        </Section>

        <Section title="13. Changes to Terms">
          We may update these Terms at any time. We will notify you of material changes by email or in-app notice. Continued use of the Service after changes constitutes acceptance.
        </Section>

        <Section title="14. Contact">
          For questions about these Terms, contact us at <a href="mailto:support@yourledgerly.com" className="text-blue-800 underline underline-offset-2">support@yourledgerly.com</a>.
        </Section>
      </main>

      <footer className="border-t border-gray-200 py-6 px-6 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/terms" className="hover:text-gray-700 transition-colors font-medium text-gray-600">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
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
