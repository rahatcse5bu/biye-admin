import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ExclamationTriangleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

export type ConfirmOptions = {
  title: string
  message?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

const toneStyles = {
  danger: {
    icon: ExclamationTriangleIcon,
    iconWrap: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
  },
  primary: {
    icon: QuestionMarkCircleIcon,
    iconWrap: 'bg-blue-100 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
  },
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<ConfirmFn>((next) => {
    // TODO: a new request cancels any dialog still open.
    resolver.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }, [])

  useEffect(() => {
    if (!options) return
    // TODO: focus Cancel so Enter never confirms a destructive action by accident.
    cancelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [options, close])

  const tone = toneStyles[options?.tone || 'danger']
  const Icon = tone.icon

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => close(false)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="flex gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.iconWrap}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="confirm-dialog-title" className="text-lg font-bold text-gray-900">
                  {options.title}
                </h3>
                {options.message && (
                  <div className="mt-2 text-sm leading-6 text-gray-600">{options.message}</div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                {options.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${tone.button}`}
              >
                {options.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = (): ConfirmFn => {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider')
  return confirm
}
