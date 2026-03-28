import React, { useEffect, useState } from 'react'
import {
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { dashboardService, DashboardStats } from '../services/dashboardService'

// ── Stat card ──────────────────────────────────────────────────────────────────
interface StatCard {
  name: string
  value: string | number
  sub: string
  icon: React.ElementType
  gradient: string
  iconBg: string
}

const StatCard: React.FC<StatCard> = ({ name, value, sub, icon: Icon, gradient, iconBg }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className={`h-1 ${gradient}`} />
    <div className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{name}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  </div>
)

// ── Breakdown row ──────────────────────────────────────────────────────────────
const BreakdownRow: React.FC<{
  label: string
  value: string | number
  dot: string
}> = ({ label, value, dot }) => (
  <div className="flex justify-between items-center py-1.5">
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-900">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </span>
  </div>
)

// ── Custom pie label ───────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [bioStats, setBioStats] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const [adminStats, bStats] = await Promise.allSettled([
          dashboardService.getStats(),
          dashboardService.getBioStats(),
        ])
        if (adminStats.status === 'fulfilled') setStats(adminStats.value)
        if (bStats.status === 'fulfilled') setBioStats(bStats.value)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading dashboard…</p>
      </div>
    )
  }

  const cards: StatCard[] = stats
    ? [
        {
          name: 'Total Users',
          value: stats.users.total,
          sub: `${stats.users.active} active`,
          icon: UsersIcon,
          gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
          iconBg: 'bg-indigo-500',
        },
        {
          name: 'Total Biodatas',
          value: stats.biodatas.total,
          sub: `${stats.biodatas.verified} verified`,
          icon: DocumentTextIcon,
          gradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          iconBg: 'bg-emerald-500',
        },
        {
          name: 'Revenue',
          value: `৳${stats.payments.revenue.toLocaleString()}`,
          sub: `${stats.payments.completed} completed`,
          icon: CreditCardIcon,
          gradient: 'bg-gradient-to-r from-violet-500 to-purple-600',
          iconBg: 'bg-violet-500',
        },
        {
          name: 'Pending Payments',
          value: stats.payments.pending,
          sub: `${stats.payments.total} total`,
          icon: ClockIcon,
          gradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
          iconBg: 'bg-amber-500',
        },
      ]
    : bioStats
    ? [
        {
          name: 'Total Biodatas',
          value: bioStats.total || 0,
          sub: 'all submissions',
          icon: DocumentTextIcon,
          gradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          iconBg: 'bg-emerald-500',
        },
        {
          name: 'পাত্রের বায়োডাটা',
          value: bioStats['পুরুষ'] || 0,
          sub: 'male biodatas',
          icon: UsersIcon,
          gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
          iconBg: 'bg-indigo-500',
        },
        {
          name: 'পাত্রীর বায়োডাটা',
          value: bioStats['মহিলা'] || 0,
          sub: 'female biodatas',
          icon: UsersIcon,
          gradient: 'bg-gradient-to-r from-pink-500 to-rose-500',
          iconBg: 'bg-pink-500',
        },
      ]
    : []

  const pieData = stats
    ? [
        { name: 'Active',   value: stats.users.active,   color: '#10B981' },
        { name: 'Inactive', value: stats.users.inactive, color: '#F59E0B' },
        { name: 'Banned',   value: stats.users.banned,   color: '#EF4444' },
        { name: 'Pending',  value: stats.users.pending,  color: '#6366F1' },
      ].filter((d) => d.value > 0)
    : []

  const bioBarData = bioStats
    ? [
        { name: 'পুরুষ',   count: bioStats['পুরুষ']  || 0 },
        { name: 'মহিলা', count: bioStats['মহিলা'] || 0 },
      ]
    : []

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-400 mt-0.5">Live platform statistics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <StatCard key={c.name} {...c} />
        ))}
      </div>

      {/* Charts row */}
      {(pieData.length > 0 || bioBarData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {pieData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">User Status</h3>
              <p className="text-xs text-gray-400 mb-5">Distribution across all accounts</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {bioBarData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Biodata Gender Split</h3>
              <p className="text-xs text-gray-400 mb-5">Male vs. female submissions</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bioBarData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    <Cell fill="#6366f1" />
                    <Cell fill="#ec4899" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Breakdown panels */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <UsersIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Users Breakdown</h3>
            </div>
            <div className="divide-y divide-gray-50">
              <BreakdownRow label="Active"        value={stats.users.active}   dot="bg-emerald-400" />
              <BreakdownRow label="Inactive"      value={stats.users.inactive} dot="bg-gray-300" />
              <BreakdownRow label="Pending"       value={stats.users.pending}  dot="bg-amber-400" />
              <BreakdownRow label="Banned"        value={stats.users.banned}   dot="bg-red-400" />
              <BreakdownRow label="New (30 days)" value={stats.users.recent}   dot="bg-indigo-400" />
            </div>
          </div>

          {/* Biodatas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DocumentTextIcon className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Biodatas</h3>
            </div>
            <div className="divide-y divide-gray-50">
              <BreakdownRow label="Total"    value={stats.biodatas.total}   dot="bg-indigo-400" />
              <BreakdownRow label="Verified" value={stats.biodatas.verified} dot="bg-emerald-400" />
              <BreakdownRow label="Pending"  value={stats.biodatas.pending}  dot="bg-amber-400" />
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-violet-50 rounded-lg">
                <CreditCardIcon className="h-4 w-4 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Payments</h3>
            </div>
            <div className="divide-y divide-gray-50">
              <BreakdownRow label="Total"     value={stats.payments.total}                         dot="bg-indigo-400" />
              <BreakdownRow label="Completed" value={stats.payments.completed}                     dot="bg-emerald-400" />
              <BreakdownRow label="Pending"   value={stats.payments.pending}                       dot="bg-amber-400" />
              <BreakdownRow label="Revenue"   value={`৳${stats.payments.revenue.toLocaleString()}`} dot="bg-violet-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
