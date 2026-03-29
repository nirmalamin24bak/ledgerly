'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  LogOut,
  Receipt,
  UsersRound,
  BookUser,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const companyNav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/suppliers',  label: 'Suppliers',   icon: BookUser },
  { href: '/bills',      label: 'Bills',        icon: FileText },
  { href: '/payments',   label: 'Payments',     icon: CreditCard },
  { href: '/reports',    label: 'Reports',      icon: BarChart3 },
  { href: '/team',       label: 'Team',         icon: UsersRound },
]

const individualNav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/suppliers',  label: 'Contacts',   icon: Users },
  { href: '/bills',      label: 'Receipts',   icon: Receipt },
  { href: '/reports',    label: 'Reports',    icon: BarChart3 },
]

export default function Sidebar({
  userName,
  accountType,
}: {
  userName: string
  accountType: 'individual' | 'company'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navItems = accountType === 'company' ? companyNav : individualNav

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 bg-blue-950 text-gray-100 flex flex-col h-full fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-white/10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-heading text-[15px] font-semibold leading-none tracking-tight">Ledgerly</div>
          <div className="text-[11px] text-blue-300/70 mt-1 font-medium">Know your numbers</div>
        </div>
      </div>

      {/* Account type badge */}
      <div className="px-5 pt-3 pb-1">
        <span className={cn(
          'inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
          accountType === 'company'
            ? 'bg-blue-800/60 text-blue-200'
            : 'bg-white/10 text-blue-300'
        )}>
          {accountType === 'company'
            ? <UsersRound className="w-2.5 h-2.5" />
            : <Users className="w-2.5 h-2.5" />
          }
          {accountType}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-200/80 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-blue-300/70')} />
              <span>{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 mb-1">
          <p className="text-[11px] text-blue-400/60 uppercase tracking-wider font-semibold mb-0.5">Signed in as</p>
          <p className="text-xs text-blue-200 truncate font-medium">{userName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-blue-200/70 hover:bg-white/8 hover:text-white transition-all duration-150 w-full mt-1"
        >
          <LogOut className="w-4 h-4 text-blue-300/60" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
