import React, { useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useConfirm } from '../components/ConfirmDialog'
import { contactMessageService, ContactMessage, ContactMessageStatus } from '../services/contactMessageService'

const SITE_URL = 'https://www.bibaho.org'

const tabs: { label: string; value: '' | ContactMessageStatus }[] = [
  { label: 'New', value: 'new' },
  { label: 'Read', value: 'read' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: '' },
]

const statusStyle: Record<ContactMessageStatus, string> = {
  new: 'bg-amber-100 text-amber-800',
  read: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const ContactMessages: React.FC = () => {
  const [status, setStatus] = useState<'' | ContactMessageStatus>('new')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const limit = 20

  const { data: res, isLoading, isFetching, error } = useQuery({
    queryKey: ['contact-messages', { status, page, limit, search: debouncedSearch }],
    queryFn: () => contactMessageService.list({ page, limit, status, search: debouncedSearch }),
  })

  const items: ContactMessage[] = res?.data || []
  const totalPages = res?.totalPages || 1
  const total = res?.total ?? items.length

  // TODO: one prefix refreshes the list and the sidebar unread badge together.
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['contact-messages'] })

  const statusMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: ContactMessageStatus }) => contactMessageService.setStatus(id, next),
    onSuccess: refresh,
    onError: () => toast.error('Failed to update message'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => contactMessageService.remove(id),
    onSuccess: () => {
      refresh()
      toast.success('Message deleted')
    },
    onError: () => toast.error('Failed to delete message'),
  })

  const handleDelete = async (message: ContactMessage) => {
    const ok = await confirm({
      title: 'Delete this message?',
      message: `The message from ${message.name} will be removed permanently.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (ok) deleteMut.mutate(message._id)
  }

  const replyHref = (message: ContactMessage) =>
    `mailto:${message.email}?subject=${encodeURIComponent('Re: আপনার বার্তা')}&body=${encodeURIComponent(`\n\n---\n${message.message}`)}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
          <p className="mt-1 text-gray-500">Messages sent from the website's Contact us form</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => {
                setStatus(tab.value)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value ? 'bg-green-800 text-white' : 'text-gray-600 hover:bg-green-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search name, email, phone, message..."
            className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-green-700 focus:ring-green-700"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <ArrowPathIcon className="h-10 w-10 animate-spin text-green-700" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Error loading contact messages</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-white py-16 text-center shadow">
          <InboxIcon className="h-12 w-12 text-gray-300" />
          <p className="mt-3 font-medium text-gray-600">No messages here</p>
          <p className="text-sm text-gray-400">{status === 'new' ? "You're all caught up." : 'Try another filter.'}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((message) => (
            <li
              key={message._id}
              className={`rounded-xl bg-white p-5 shadow ${message.status === 'new' ? 'ring-1 ring-amber-200' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{message.name}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyle[message.status]}`}>
                      {message.status}
                    </span>
                    {message.bio && (
                      <a
                        href={`${SITE_URL}/biodata/${encodeURIComponent(message.bio.replace(/\D/g, '') || message.bio)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Biodata #{message.bio}
                      </a>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <a href={`mailto:${message.email}`} className="inline-flex items-center gap-1 hover:text-green-800">
                      <EnvelopeIcon className="h-4 w-4" />
                      {message.email}
                    </a>
                    {message.phone && (
                      <a href={`tel:${message.phone}`} className="inline-flex items-center gap-1 hover:text-green-800">
                        <PhoneIcon className="h-4 w-4" />
                        {message.phone}
                      </a>
                    )}
                  </div>
                </div>
                <time className="text-sm text-gray-400" dateTime={message.createdAt}>
                  {format(new Date(message.createdAt), 'dd MMM yyyy, HH:mm')}
                </time>
              </div>

              <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                {message.message}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={replyHref(message)}
                  onClick={() => message.status === 'new' && statusMut.mutate({ id: message._id, next: 'read' })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-900"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  Reply by email
                </a>
                {message.status === 'new' && (
                  <button
                    type="button"
                    onClick={() => statusMut.mutate({ id: message._id, next: 'read' })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <EnvelopeOpenIcon className="h-4 w-4" />
                    Mark read
                  </button>
                )}
                {message.status !== 'resolved' ? (
                  <button
                    type="button"
                    onClick={() => statusMut.mutate({ id: message._id, next: 'resolved' })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Mark resolved
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => statusMut.mutate({ id: message._id, next: 'read' })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reopen
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(message)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm shadow">
          <span className="text-gray-600">
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactMessages
