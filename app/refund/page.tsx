import Link from 'next/link'
import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Refund Policy — Ledgerly' }

export default function RefundPage() {
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
        <h1 className="text-3xl font-bold text-gray-950 mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 2025</p>

        <Section title="Free Plan">
          Ledgerly&apos;s Individual plan is free forever. No payment is required, and no charges will ever be made for the free tier.
        </Section>

        <Section title="Paid Subscriptions">
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-gray-800">Monthly plans:</strong> Eligible for a full refund if requested within 7 days of the initial payment. Subsequent monthly renewals are non-refundable.</li>
          </ul>
        </Section>

        <Section title="How to Request a Refund">
          To request a refund, email us at <a href="mailto:support@yourledgerly.com" className="text-blue-800 underline underline-offset-2">support@yourledgerly.com</a> with:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Your registered email address</li>
            <li>The date of payment</li>
            <li>The reason for your request</li>
          </ul>
          We will process eligible refunds within 5–10 business days. Refunds are returned to the original payment method via Razorpay.
        </Section>

        <Section title="Non-Refundable Cases">
          Refunds will not be issued for:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Requests made outside the eligible refund window</li>
            <li>Accounts suspended or terminated for Terms of Service violations</li>
            <li>Partial use of a subscription period beyond the refund window</li>
            <li>Charges resulting from failure to cancel before renewal</li>
          </ul>
        </Section>

        <Section title="Cancellations">
          You may cancel your subscription at any time from the Settings page. Cancellation stops future billing but does not entitle you to a refund for the current billing period. You will retain access to the Company plan features until the end of your paid period.
        </Section>

        <Section title="Chargebacks">
          We ask that you contact us before initiating a chargeback with your bank or payment provider. Chargebacks may result in immediate account suspension while the dispute is resolved.
        </Section>

        <Section title="Changes to This Policy">
          We reserve the right to update this Refund Policy at any time. Changes will be communicated via email or in-app notice.
        </Section>

        <Section title="Contact">
          Questions about refunds? Email us at <a href="mailto:support@yourledgerly.com" className="text-blue-800 underline underline-offset-2">support@yourledgerly.com</a>. We aim to respond within 1 business day.
        </Section>
      </main>

      <footer className="border-t border-gray-200 py-6 px-6 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
          <Link href="/refund" className="hover:text-gray-700 transition-colors font-medium text-gray-600">Refund Policy</Link>
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
