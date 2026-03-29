import Link from 'next/link'
import {
  ScanLine, BookOpen, Users, BarChart3, Shield, Zap,
  ArrowRight, CheckCircle2, FileText, CreditCard, Brain
} from 'lucide-react'

const features = [
  {
    icon: ScanLine,
    title: 'AI Bill Scanning',
    desc: 'Snap a photo of any invoice. Claude AI extracts supplier, GST, amounts, and line items in seconds.',
  },
  {
    icon: BookOpen,
    title: 'Live Ledger',
    desc: 'Running balance per supplier, updated instantly with every bill and payment. Always know what you owe.',
  },
  {
    icon: Users,
    title: 'Team Access',
    desc: 'Invite your accountant with one click. Read-only access — they see everything, change nothing.',
  },
  {
    icon: BarChart3,
    title: 'GST & TDS Reports',
    desc: 'Monthly GST summaries, CGST/SGST/IGST breakdowns, and TDS tracking ready for filing.',
  },
  {
    icon: Brain,
    title: 'Ask Your Data',
    desc: 'Type "How much did I pay in March?" and get a real answer. AI turns plain English into live queries.',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    desc: 'Row-level security on every record. Signed URLs for documents. Rate-limited AI endpoints.',
  },
]

const plans = [
  {
    name: 'Individual',
    price: 'Free',
    sub: 'forever',
    desc: 'For freelancers and individuals tracking personal expenses.',
    features: ['Unlimited receipts', 'AI bill scanning', 'Supplier contacts', 'Reports'],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Company',
    price: '₹499',
    sub: 'per month',
    desc: 'For businesses managing supplier bills, GST, and team access.',
    features: ['Everything in Individual', 'Supplier ledger', 'Payment tracking', 'Team / accountant access', 'GST & TDS reports', 'AI natural language queries'],
    cta: 'Start free trial',
    highlight: true,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-[17px] font-semibold text-gray-900 tracking-tight">
              Ledgerly
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link href="/login?mode=signup" className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-950 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100">
            <Zap className="w-3 h-3" />
            Powered by Claude AI
          </div>
          <h1 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-5xl md:text-6xl font-bold text-gray-950 tracking-tight leading-[1.1] mb-6">
            Know your numbers.<br />
            <span className="text-blue-900">Always.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Scan bills with AI, track supplier balances, manage GST and TDS — all in one place.
            Built for businesses and individuals who take their finances seriously.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login?mode=signup" className="inline-flex items-center gap-2 bg-blue-950 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-blue-900 transition-colors shadow-sm">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
              Sign in to your account
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">No credit card required · Free plan available</p>
        </div>
      </section>

      {/* ── Dashboard preview ───────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-2xl p-1 shadow-2xl">
            <div className="bg-[#f6f7f9] rounded-xl overflow-hidden">
              {/* Fake browser bar */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="flex-1 mx-4 bg-gray-100 rounded-md h-6 flex items-center px-3">
                  <span className="text-xs text-gray-400">yourledgerly.com/dashboard</span>
                </div>
              </div>
              {/* Dashboard mockup */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-6 w-32 bg-gray-900 rounded-md" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', paddingLeft: 8, color: 'white' }}>Dashboard</div>
                    <div className="text-xs text-gray-400 mt-1">Sunday, 29 March 2026</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 gap-1">
                      <Users className="w-3 h-3" /> Supplier
                    </div>
                    <div className="h-8 w-24 bg-blue-950 rounded-lg flex items-center justify-center text-xs font-semibold text-white gap-1">
                      <ScanLine className="w-3 h-3" /> Upload Bill
                    </div>
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Outstanding', value: '₹8,42,500', color: 'text-red-600' },
                    { label: 'This Month', value: '₹1,20,000', color: 'text-gray-900' },
                    { label: 'Overdue', value: '₹45,000', color: 'text-amber-600' },
                    { label: 'Suppliers', value: '24', color: 'text-gray-900' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                      <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {/* Table preview */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Bills</div>
                  {[
                    { supplier: 'Sharma Steel Co.', inv: 'INV-2024-089', amount: '₹1,24,500', status: 'pending', statusColor: 'bg-amber-50 text-amber-700' },
                    { supplier: 'Metro Cement Works', inv: 'INV-2024-088', amount: '₹68,200', status: 'paid', statusColor: 'bg-emerald-50 text-emerald-700' },
                    { supplier: 'RMC Builders Supply', inv: 'INV-2024-087', amount: '₹2,15,000', status: 'partial', statusColor: 'bg-blue-50 text-blue-700' },
                  ].map(r => (
                    <div key={r.inv} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 text-xs">
                      <div className="font-medium text-gray-800">{r.supplier}</div>
                      <div className="text-gray-400">{r.inv}</div>
                      <div className="font-semibold text-gray-900">{r.amount}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.statusColor}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-4xl font-bold text-gray-950 tracking-tight mb-4">
              Everything you need to stay on top
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From scanning a bill to filing GST — Ledgerly handles the full cycle.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-4xl font-bold text-gray-950 tracking-tight mb-4">
              How it works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: ScanLine, title: 'Upload a bill', desc: 'Take a photo or upload a PDF. Our AI reads every field — supplier, GST number, amounts, line items.' },
              { step: '02', icon: CreditCard, title: 'Record payments', desc: 'Mark bills as paid — fully or partially. The ledger updates instantly with running balance.' },
              { step: '03', icon: BarChart3, title: 'Get reports', desc: 'See GST summaries, outstanding by supplier, overdue alerts. Export-ready for your CA.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="relative inline-flex">
                  <div className="w-14 h-14 rounded-2xl bg-blue-950 flex items-center justify-center mx-auto mb-5">
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center">{s.step}</span>
                </div>
                <h3 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-4xl font-bold text-gray-950 tracking-tight mb-4">
              Simple pricing
            </h2>
            <p className="text-gray-500">Start free. Upgrade when your business needs it.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map(p => (
              <div key={p.name} className={`rounded-2xl p-8 border ${p.highlight ? 'bg-blue-950 border-blue-900 text-white' : 'bg-white border-gray-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${p.highlight ? 'text-blue-300' : 'text-gray-400'}`}>{p.name}</div>
                <div className="flex items-end gap-1.5 mb-1">
                  <span style={{ fontFamily: "'Satoshi', sans-serif" }} className={`text-4xl font-bold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                  <span className={`text-sm pb-1 ${p.highlight ? 'text-blue-300' : 'text-gray-400'}`}>/{p.sub}</span>
                </div>
                <p className={`text-sm mb-6 ${p.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{p.desc}</p>
                <ul className="space-y-2.5 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.highlight ? 'text-blue-300' : 'text-emerald-500'}`} />
                      <span className={p.highlight ? 'text-blue-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login?mode=signup"
                  className={`block text-center text-sm font-semibold py-3 rounded-xl transition-colors ${
                    p.highlight
                      ? 'bg-white text-blue-950 hover:bg-blue-50'
                      : 'bg-blue-950 text-white hover:bg-blue-900'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }} className="text-4xl font-bold text-gray-950 tracking-tight mb-4">
            Ready to know your numbers?
          </h2>
          <p className="text-gray-500 mb-8">Join businesses already using Ledgerly to stay on top of their supplier finances.</p>
          <Link href="/login?mode=signup" className="inline-flex items-center gap-2 bg-blue-950 text-white text-sm font-semibold px-8 py-4 rounded-xl hover:bg-blue-900 transition-colors shadow-sm">
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-950 flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span style={{ fontFamily: "'Satoshi', sans-serif" }} className="text-sm font-semibold text-gray-800">Ledgerly</span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Ledgerly. AI-powered bill tracking for businesses and individuals.</p>
          <div className="flex gap-5 text-xs text-gray-400">
            <Link href="/login" className="hover:text-gray-700 transition-colors">Sign in</Link>
            <Link href="/login?mode=signup" className="hover:text-gray-700 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
