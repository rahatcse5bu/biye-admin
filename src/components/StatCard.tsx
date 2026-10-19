import React from 'react'
import clsx from 'clsx'

const ACCENTS = {
  blue: { ring: 'ring-blue-500', soft: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  indigo: { ring: 'ring-indigo-500', soft: 'bg-indigo-50 text-indigo-600', dot: 'bg-indigo-500' },
  green: { ring: 'ring-emerald-500', soft: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  yellow: { ring: 'ring-amber-500', soft: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  red: { ring: 'ring-red-500', soft: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  violet: { ring: 'ring-violet-500', soft: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500' },
} as const

export type StatAccent = keyof typeof ACCENTS

interface StatCardProps {
  label: string
  value: React.ReactNode
  onClick: () => void
  selected?: boolean
  accent?: StatAccent
  icon?: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ label, value, onClick, selected, accent = 'blue', icon }) => {
  const a = ACCENTS[accent]
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        'group flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2',
        a.ring,
        selected && ['ring-2', a.ring],
      )}
    >
      {icon && <div className={clsx('rounded-xl p-2.5 transition-transform group-hover:scale-105', a.soft)}>{icon}</div>}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          {!icon && <span className={clsx('h-2 w-2 rounded-full', a.dot)} />}
          {label}
        </div>
        <div className="truncate text-2xl font-bold text-gray-900">{value}</div>
      </div>
    </button>
  )
}

export default StatCard
