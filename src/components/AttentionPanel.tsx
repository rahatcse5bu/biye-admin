import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  ArrowUturnLeftIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { dashboardService } from '../services/dashboardService'
import { biodataRevisionService } from '../services/biodataRevisionService'
import { contactMessageService } from '../services/contactMessageService'
import { refundService } from '../services/refundService'
import { featuredRequestService } from '../services/featuredRequestService'

type CountState = { value: number; pending: boolean; failed: boolean }

type Task = {
  label: string
  hint: string
  count: CountState
  href: string
  icon: React.ElementType
}

// TODO: same query keys as the sidebar badges, so both share one request and refresh together.
const useCount = (queryKey: string[], queryFn: () => Promise<number>): CountState => {
  const query = useQuery({ queryKey, queryFn, refetchInterval: 60_000, refetchOnWindowFocus: true })
  return { value: query.data ?? 0, pending: query.isPending, failed: query.isError }
}

const AttentionPanel: React.FC = () => {
  const tasks: Task[] = [
    {
      label: 'New biodatas to review',
      hint: 'Approve or reject so members can go live',
      count: useCount(['biodatas', 'pending-count'], dashboardService.getPendingBiodataCount),
      href: '/biodatas?status=pending',
      icon: DocumentTextIcon,
    },
    {
      label: 'Biodata edits to approve',
      hint: 'Members changed a published biodata',
      count: useCount(['biodata-revisions', 'pending-count'], biodataRevisionService.pendingCount),
      href: '/biodata-changes',
      icon: PencilSquareIcon,
    },
    {
      label: 'Unread messages',
      hint: 'Sent from the website contact form',
      count: useCount(['contact-messages', 'unread-count'], contactMessageService.unreadCount),
      href: '/contact-messages',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      label: 'Refund requests',
      hint: 'Members waiting for their money back',
      count: useCount(['refund-requests', 'requested-count'], () =>
        refundService.listRequests('requested').then((rows) => rows.length),
      ),
      href: '/refunds',
      icon: ArrowUturnLeftIcon,
    },
    {
      label: 'Featured requests',
      hint: 'Paid to appear on the homepage',
      count: useCount(['featured-requests', 'pending-count'], () =>
        featuredRequestService.list('pending').then((result) => result.pending ?? result.total),
      ),
      href: '/featured-requests',
      icon: StarIcon,
    },
  ]

  const open = tasks.filter((task) => task.count.value > 0)
  const loading = tasks.some((task) => task.count.pending)
  const failed = tasks.filter((task) => task.count.failed)

  return (
    <section aria-labelledby="attention-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 id="attention-heading" className="text-base font-semibold text-slate-900">
        Needs your attention
      </h3>
      <p className="mt-1 text-xs text-slate-500">Work waiting for an admin. Click a row to start.</p>

      {open.length === 0 && !loading && failed.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          All caught up. Nothing is waiting for review.
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {open.map((task) => (
            <li key={task.href}>
              <Link
                to={task.href}
                className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <task.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">{task.label}</span>
                  <span className="block text-xs text-slate-500">{task.hint}</span>
                </span>
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-sm font-semibold text-white">
                  {task.count.value.toLocaleString()}
                </span>
                <ChevronRightIcon className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </Link>
            </li>
          ))}
          {loading && <li className="py-3 text-xs text-slate-400">Checking for more…</li>}
          {failed.length > 0 && (
            <li className="py-3 text-xs text-amber-700">
              Couldn't check: {failed.map((task) => task.label.toLowerCase()).join(', ')}. Refresh the page to try again.
            </li>
          )}
        </ul>
      )}
    </section>
  )
}

export default AttentionPanel
