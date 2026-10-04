import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bars3Icon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/':                  { title: 'Dashboard',          description: 'Platform overview & analytics' },
  '/biodatas':          { title: 'Biodatas',            description: 'Manage and review biodata submissions' },
  '/users':             { title: 'Users',               description: 'Manage registered user accounts' },
  '/payments':          { title: 'Payments',            description: 'Track transactions and revenue' },
  '/contact-purchases': { title: 'Contact Purchases',   description: 'View contact purchase history' },
  '/refunds':           { title: 'Refunds',             description: 'Process bKash refunds' },
  '/unverified-biodatas': { title: 'Unverified Biodatas', description: 'Review submissions awaiting verification' },
  '/templates': { title: 'Templates', description: 'Manage biodata forms and fields' },
  '/settings':          { title: 'Settings',            description: 'API and system configuration' },
}

const Header: React.FC<{ onMenuToggle: () => void; menuOpen: boolean; onSidebarToggle: () => void; sidebarCollapsed: boolean }> = ({ onMenuToggle, menuOpen, onSidebarToggle, sidebarCollapsed }) => {
  const { user } = useAuthStore()
  const location = useLocation()
  const page = PAGE_TITLES[location.pathname] ?? { title: 'Admin Panel', description: 'PNC Nikah Administration' }

  return (
    <header className="flex h-20 flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenuToggle} aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="admin-navigation" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <button
          onClick={onSidebarToggle}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 lg:inline-flex"
        >
          {sidebarCollapsed ? <ChevronDoubleRightIcon className="h-5 w-5" /> : <ChevronDoubleLeftIcon className="h-5 w-5" />}
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">Workspace</span>
            <ChevronRightIcon className="hidden h-3 w-3 sm:block" />
            <span className="font-medium text-slate-800">{page.title}</span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{page.description}</p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3 border-l border-slate-200 pl-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-sm font-semibold text-white">
          {user?.email?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.user_name || 'Admin'}</p>
          <p className="mt-0.5 text-xs capitalize text-slate-500">{user?.user_role || 'admin'}</p>
        </div>
      </div>
    </header>
  )
}

export default Header
