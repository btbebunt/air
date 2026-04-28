'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plane, CalendarDays, BookOpen, Car, Map, Settings, LogOut, LayoutDashboard } from 'lucide-react'

const NAV = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/dashboard/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/admin/dashboard/flights', label: 'Flights', icon: CalendarDays },
  { href: '/admin/dashboard/vehicles', label: 'Vehicles', icon: Car },
  { href: '/admin/dashboard/tours', label: 'Tours', icon: Map },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin')
  }

  return (
    <aside className="w-60 shrink-0 bg-slate-900 min-h-screen flex flex-col">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <Plane size={15} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Shuttle Mongolia</div>
            <div className="text-slate-500 text-xs">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'}
              `}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all mb-1"
        >
          <Settings size={16} />
          View Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
