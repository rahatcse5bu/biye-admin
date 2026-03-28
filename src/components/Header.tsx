import React from 'react'
import { useLocation } from 'react-router-dom'
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/':                  { title: 'Dashboard',          description: 'Platform overview & analytics' },
  '/biodatas':          { title: 'Biodatas',            description: 'Manage and review biodata submissions' },
  '/users':             { title: 'Users',               description: 'Manage registered user accounts' },
  '/payments':          { title: 'Payments',            description: 'Track transactions and revenue' },
  '/contact-purchases': { title: 'Contact Purchases',   description: 'View contact purchase history' },
  '/refunds':           { title: 'Refunds',             description: 'Process bKash refunds' },
  '/settings':          { title: 'Settings',            description: 'API and system configuration' },
}

const Header: React.FC = () => {
  const { user } = useAuthStore()
  const location = useLocation()
  const page = PAGE_TITLES[location.pathname] ?? { title: 'Admin Panel', description: 'PNC Nikah Administration' }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{page.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{page.description}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search hint */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-400 mr-2 w-44 cursor-default">
          <MagnifyingGlassIcon className="w-4 h-4" />
          <span className="text-xs">Quick search…</span>
        </div>

        {/* Bell */}
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <BellIcon className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-gray-800 leading-none">
              {user?.user_name || 'Admin'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.user_role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
