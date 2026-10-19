import React from 'react'
import clsx from 'clsx'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

type PageItem = number | 'gap-left' | 'gap-right'

// TODO: always keeps first/last page visible with `siblings` pages around the current one
function getPageItems(page: number, totalPages: number, siblings = 1): PageItem[] {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
  if (totalPages <= siblings * 2 + 5) return range(1, totalPages)

  const left = Math.max(page - siblings, 2)
  const right = Math.min(page + siblings, totalPages - 1)
  const edgeCount = siblings * 2 + 3

  if (left <= 3) return [...range(1, edgeCount), 'gap-right', totalPages]
  if (right >= totalPages - 2) return [1, 'gap-left', ...range(totalPages - edgeCount + 1, totalPages)]
  return [1, 'gap-left', ...range(left, right), 'gap-right', totalPages]
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
  className?: string
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className = 'border-t bg-gray-50',
}) => {
  const pages = Math.max(1, totalPages || 1)
  const current = Math.min(Math.max(1, page), pages)
  if (totalItems === 0) return null

  const go = (p: number) => {
    if (p >= 1 && p <= pages && p !== current) onPageChange(p)
  }

  const from = pageSize && totalItems ? (current - 1) * pageSize + 1 : null
  const to = pageSize && totalItems ? Math.min(current * pageSize, totalItems) : null

  const navBtn =
    'inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

  return (
    <nav
      aria-label="Pagination"
      className={clsx('flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm', className)}
    >
      <p className="text-gray-600">
        {from && to ? (
          <>
            Showing <span className="font-semibold text-gray-900">{from}</span>–
            <span className="font-semibold text-gray-900">{to}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalItems}</span>
          </>
        ) : (
          <>
            Page <span className="font-semibold text-gray-900">{current}</span> of{' '}
            <span className="font-semibold text-gray-900">{pages}</span>
            {totalItems != null && (
              <>
                {' '}· <span className="font-semibold text-gray-900">{totalItems}</span> total
              </>
            )}
          </>
        )}
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous page" disabled={current <= 1} onClick={() => go(current - 1)} className={navBtn}>
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <span className="px-2 text-gray-600 sm:hidden">
            {current} / {pages}
          </span>

          <ul className="hidden items-center gap-1 sm:flex">
            {getPageItems(current, pages).map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  <button
                    type="button"
                    aria-label={`Page ${item}`}
                    aria-current={item === current ? 'page' : undefined}
                    onClick={() => go(item)}
                    className={clsx(
                      'h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                      item === current
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-white hover:ring-1 hover:ring-inset hover:ring-gray-200',
                    )}
                  >
                    {item}
                  </button>
                </li>
              ) : (
                <li key={item} aria-hidden className="w-6 select-none text-center text-gray-400">
                  …
                </li>
              ),
            )}
          </ul>

          <button type="button" aria-label="Next page" disabled={current >= pages} onClick={() => go(current + 1)} className={navBtn}>
            <span className="hidden sm:inline">Next</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  )
}

export default Pagination
