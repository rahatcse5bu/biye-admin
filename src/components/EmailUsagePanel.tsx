import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { EmailUsage, emailUsageService } from '../services/emailSettingsService'

const statusStyle: Record<EmailUsage['status'], { label: string; badge: string; bar: string; Icon: React.ElementType }> = {
  ok: { label: 'Healthy', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500', Icon: CheckCircleIcon },
  warning: { label: 'Running low', badge: 'bg-amber-50 text-amber-700 ring-amber-200', bar: 'bg-amber-500', Icon: ExclamationTriangleIcon },
  exhausted: { label: 'Limit reached', badge: 'bg-red-50 text-red-700 ring-red-200', bar: 'bg-red-500', Icon: XCircleIcon },
}

const formatTime = (value: string | null) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
  </div>
)

function DailyLimitEditor({ limit }: { limit: number }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(limit))
  const saveMut = useMutation({
    mutationFn: (next: number) => emailUsageService.setDailyLimit(next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-usage'] })
      toast.success('Daily email limit saved')
      setEditing(false)
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to save the limit'),
  })

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(String(limit))
          setEditing(true)
        }}
        className="text-xs font-medium text-green-800 underline-offset-2 hover:underline"
      >
        Change limit
      </button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        saveMut.mutate(Number(value))
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <label htmlFor="email-daily-limit" className="sr-only">
        Daily email limit
      </label>
      <input
        id="email-daily-limit"
        type="number"
        min={1}
        max={100000}
        step={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-green-700 focus:ring-green-700"
      />
      <button
        type="submit"
        disabled={saveMut.isPending}
        className="rounded-md bg-green-800 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {saveMut.isPending ? 'Saving…' : 'Save'}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-700">
        Cancel
      </button>
      <span className="w-full text-xs text-slate-500">500 for a regular Gmail account, 2000 for Google Workspace.</span>
    </form>
  )
}

// TODO: how much of Gmail's rolling 24h sending limit is left, counted from the backend's send log.
const EmailUsagePanel: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['email-usage'],
    queryFn: emailUsageService.get,
    refetchInterval: 60_000,
  })

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        {isError ? (
          <span className="text-red-600">
            Failed to load email usage.{' '}
            <button onClick={() => refetch()} className="underline">
              Retry
            </button>
          </span>
        ) : (
          <>
            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Loading email usage…
          </>
        )}
      </div>
    )
  }

  const style = statusStyle[data.status]
  // TODO: driven by remaining, so a Gmail lockout shows a full bar even if our own count is lower.
  const usedPercent = Math.min(100, Math.round(((data.daily_limit - data.remaining) / data.daily_limit) * 100))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="email-usage-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-white">
            <EnvelopeIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 id="email-usage-title" className="text-sm font-semibold text-slate-900">
              Email Sending (Gmail)
            </h3>
            <p className="text-xs text-slate-500">Rolling 24-hour window, refreshes every minute</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${style.badge}`}>
            <style.Icon className="h-3.5 w-3.5" />
            {style.label}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Refresh email usage"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-3xl font-semibold text-slate-900">
            {data.remaining.toLocaleString()}
            <span className="ml-1.5 text-base font-normal text-slate-500">
              of {data.daily_limit.toLocaleString()} emails left today
            </span>
          </p>
          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={data.daily_limit}
            aria-valuenow={data.sent_last_24h}
            aria-label="Emails sent in the last 24 hours"
          >
            <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${usedPercent}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {data.sent_last_24h.toLocaleString()} sent in the last 24 hours
              {data.blocked_until ? ' · blocked by Gmail' : ` (${usedPercent}%)`}
            </span>
            <DailyLimitEditor limit={data.daily_limit} />
          </div>

          {data.blocked_until ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              Gmail rejected an email for exceeding its daily limit. Emails (including password resets) may fail until about{' '}
              <strong>{formatTime(data.blocked_until)}</strong>.
            </p>
          ) : data.remaining === 0 ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              The daily limit is used up. The next email can go out around <strong>{formatTime(data.next_slot_at)}</strong>.
            </p>
          ) : data.status === 'warning' ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Over 80% of today&apos;s limit is used. Avoid bulk emails until the window frees up.
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Total sent" value={data.total_sent.toLocaleString()} />
            <Stat label="Total failed" value={data.total_failed.toLocaleString()} />
            <Stat
              label="Counting since"
              value={<span className="text-sm">{data.counting_since ? new Date(data.counting_since).toLocaleDateString() : '—'}</span>}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">Last 7 days</p>
          {data.daily.length ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.daily} barGap={2}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(date: string) => date.slice(5)}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="sent" name="Sent" stackId="a" fill="#15803d" isAnimationActive={false} />
                <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No emails sent in the last 7 days.</p>
          )}

          {data.recent_failures.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500">Recent failures</p>
              <ul className="mt-1 divide-y divide-slate-100 text-xs">
                {data.recent_failures.map((failure) => (
                  <li key={failure._id} className="py-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="truncate font-medium text-slate-700">{failure.to}</span>
                      <span className="shrink-0 text-slate-400">{formatTime(failure.createdAt)}</span>
                    </div>
                    <p className="truncate text-slate-500" title={failure.error}>
                      {failure.limit_hit ? 'Daily limit exceeded' : failure.error || 'Unknown error'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Counts emails sent by the website. Emails sent by hand from the same Gmail account also use Gmail&apos;s limit but
        aren&apos;t shown here.
      </p>
    </section>
  )
}

export default EmailUsagePanel
