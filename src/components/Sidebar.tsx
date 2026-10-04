import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChartBarIcon,
  UsersIcon,
  CreditCardIcon,
  ArrowLeftOnRectangleIcon,
  CogIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  ExclamationCircleIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  { name: 'Biodatas', href: '/biodatas', icon: DocumentTextIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Contact Purchases', href: '/contact-purchases', icon: ShoppingCartIcon },
  { name: 'Unverified Biodatas', href: '/unverified-biodatas', icon: ExclamationCircleIcon },
  { name: 'Refunds', href: '/refunds', icon: ArrowPathIcon },
  { name: 'Templates', href: '/templates', icon: PaintBrushIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const location = useLocation()
  const { logout, user } = useAuthStore()

  return (
    <aside id="admin-navigation" aria-label="Main navigation" className={`admin-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-shrink-0 flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${open ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible'}`}>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-bold text-sm tracking-tight">PN</span>
        </div>
        <div className="leading-tight">
          <p className="text-white font-semibold text-sm">PNC Nikah</p>
          <p className="text-slate-400 text-xs">Administration</p>
        </div>
      </div>
      <div className="px-5 pt-5 pb-2">
        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">Workspace</p>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                  ? 'bg-teal-500/15 text-teal-200 ring-1 ring-inset ring-teal-400/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-teal-300' : 'text-slate-400'}`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 pb-4 pt-3 border-t border-slate-800 mt-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-medium truncate leading-none">
              {user?.email || 'admin'}
            </p>
            <p className="text-slate-500 text-xs mt-0.5 capitalize">
              {user?.user_role || 'admin'}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
