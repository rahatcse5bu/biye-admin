import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChartBarIcon,
  UsersIcon,
  CreditCardIcon,
  ArrowLeftOnRectangleIcon,
  CogIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  FolderOpenIcon,
  BellIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

type NavChild = {
  name: string
  href: string
  description?: string
}

type NavItem = {
  name: string
  href?: string
  icon: React.ElementType
  children?: NavChild[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  {
    name: 'Users',
    icon: UsersIcon,
    children: [
      { name: 'All Users', href: '/users', description: 'Manage every account' },
      { name: 'Admins', href: '/admins?role=admin', description: 'Staff and permissions' },
      { name: 'User Status', href: '/user-status?status=active', description: 'Active and pending users' },
    ],
  },
  {
    name: 'Biodatas',
    icon: DocumentTextIcon,
    children: [
      { name: 'All Biodatas', href: '/biodatas', description: 'Profile inventory' },
      { name: 'Verified Biodatas', href: '/verified-biodatas?status=approved', description: 'Approved records' },
      { name: 'Unverified Biodatas', href: '/unverified-biodatas?status=pending', description: 'Needs moderation' },
      { name: 'Featured Biodatas', href: '/featured-biodatas?status=approved', description: 'Premium profiles' },
    ],
  },
  {
    name: 'Moderation',
    icon: ShieldCheckIcon,
    children: [
      { name: 'Moderation Queue', href: '/moderation', description: 'Review pending profiles' },
      { name: 'AI Review', href: '/moderation?source=ai', description: 'AI generated checks' },
      { name: 'Photo Cards', href: '/templates', description: 'Visual content review' },
    ],
  },
  {
    name: 'Payments',
    icon: CreditCardIcon,
    children: [
      { name: 'Transactions', href: '/transactions?status=all', description: 'All payment records' },
      { name: 'Refunds', href: '/refunds', description: 'Manual reversals' },
      { name: 'Contact Purchases', href: '/contact-purchases', description: 'Profile contact sales' },
    ],
  },
  {
    name: 'Engagement',
    icon: BellIcon,
    children: [
      { name: 'Favorites', href: '/biodatas', description: 'Saved profiles' },
      { name: 'Shortlists', href: '/biodatas', description: 'Match queue' },
      { name: 'Reactions', href: '/biodatas', description: 'Interest signals' },
    ],
  },
  {
    name: 'Content',
    icon: FolderOpenIcon,
    children: [
      { name: 'Templates', href: '/templates', description: 'Photocard templates' },
      { name: 'Content Management', href: '/content-management', description: 'Forms and assets' },
      { name: 'Uploads', href: '/templates', description: 'Media library' },
    ],
  },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

const matchRoute = (location: { pathname: string; search: string }, target: string) => {
  if (!target) return false

  const [routePath, routeSearch = ''] = target.split('?')
  const currentSearch = location.search || ''
  const normalizedSearch = routeSearch ? `?${routeSearch}` : ''

  return location.pathname === routePath && currentSearch === normalizedSearch
}

const Sidebar: React.FC<{ open: boolean; onClose: () => void; collapsed: boolean; onToggleCollapse: () => void }> = ({ open, onClose, collapsed, onToggleCollapse }) => {
  const location = useLocation()
  const { logout, user } = useAuthStore()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navigation.filter((item) => item.children).map((item) => [item.name, true])),
  )

  useEffect(() => {
    const activeGroup = navigation.find((item) => item.children?.some((child) => matchRoute(location, child.href)))
    if (!activeGroup) return

    setExpandedGroups((groups) => ({ ...groups, [activeGroup.name]: true }))
  }, [location])

  return (
    <aside
      id="admin-navigation"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-200 lg:static ${open ? 'translate-x-0 visible' : '-translate-x-full'} lg:translate-x-0 lg:visible ${collapsed ? 'w-20 lg:w-20' : 'w-[260px] lg:w-[260px]'}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold tracking-[0.12em] text-white shadow-sm">
            PN
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">PNC Nikah</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Admin</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:flex"
        >
          {collapsed ? <ChevronDoubleRightIcon className="h-4 w-4" /> : <ChevronDoubleLeftIcon className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-5 pb-3 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
        </div>
      )}

      <nav className="flex-1 min-h-0 space-y-1.5 overflow-y-auto px-3 pb-2">
        {navigation.map((item) => {
          const isActive =
            (item.href && (location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href)))) ||
            (item.children && item.children.some((child) => matchRoute(location, child.href)))

          if (item.children) {
            const isExpanded = !collapsed && expandedGroups[item.name]

            return (
              <div key={item.name} className={`rounded-xl border ${isActive ? 'border-slate-200 bg-slate-50' : 'border-transparent bg-transparent'}`}>
                <button
                  type="button"
                  onClick={() => setExpandedGroups((groups) => ({ ...groups, [item.name]: !groups[item.name] }))}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-slate-700 transition hover:bg-slate-100"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <item.icon className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    {!collapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
                  </div>
                  {!collapsed && <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />}
                </button>

                {isExpanded && (
                  <div className="space-y-1 px-2 pb-2">
                    {item.children.map((child) => {
                      const childActive = matchRoute(location, child.href)
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          onClick={onClose}
                          className={`block rounded-lg px-3 py-2 transition-colors ${childActive
                            ? 'bg-black text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                          <span className="block text-sm font-medium">{child.name}</span>
                          {child.description && (
                            <span className="mt-1 block text-[11px] text-slate-500">{child.description}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              to={item.href || '/'}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? 'justify-center px-0' : ''} ${isActive
                ? 'bg-black text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 pb-4 pt-3">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-700">{user?.email || 'admin'}</p>
                <p className="mt-0.5 text-[11px] capitalize text-slate-500">{user?.user_role || 'admin'}</p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4 flex-shrink-0" />
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => logout()}
            className="flex h-10 w-full items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Sign out"
          >
            <ArrowLeftOnRectangleIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
