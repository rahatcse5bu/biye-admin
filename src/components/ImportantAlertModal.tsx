import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BellAlertIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { AdminNotification } from '../services/notificationService'

const timeAgo = (value: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

const ImportantAlertModal: React.FC<{
  alerts: AdminNotification[]
  onOpen: (item: AdminNotification) => void
  onLater: () => void
}> = ({ alerts, onOpen, onLater }) => {
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onLater()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onLater])

  // TODO: portal to body so a blurred or transformed header can't trap the fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="important-alert-title"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-start gap-4 border-b border-slate-100 p-6 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <BellAlertIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 id="important-alert-title" className="text-lg font-bold text-gray-900">
              {alerts.length === 1 ? 'This needs your attention' : `${alerts.length} things need your attention`}
            </h3>
            <p className="mt-1 text-sm text-gray-500">Click one to open it and start working.</p>
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {alerts.map((item, index) => (
            <li key={item._id}>
              <button
                ref={index === 0 ? firstRef : undefined}
                type="button"
                onClick={() => onOpen(item)}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-slate-600">{item.message}</span>
                  <span className="mt-1 block text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-green-800">
                  Work on it
                  <ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4">
          <p className="text-xs text-gray-500">Later keeps them in the bell until you open them.</p>
          <button
            type="button"
            onClick={onLater}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ImportantAlertModal
