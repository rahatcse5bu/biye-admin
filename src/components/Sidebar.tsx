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

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { logout, user } = useAuthStore()

  return (
    <div className="flex flex-col w-64 bg-slate-900 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-bold text-sm tracking-tight">PN</span>
        </div>
        <div className="leading-tight">
          <p className="text-white font-semibold text-sm">PNC Nikah</p>
          <p className="text-slate-500 text-xs">Admin Portal</p>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest">Menu</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-4 pt-3 border-t border-slate-800 mt-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
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
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar
