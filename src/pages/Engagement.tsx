import React, { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowPathIcon,
  BookmarkIcon,
  FaceSmileIcon,
  HandThumbDownIcon,
  HeartIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { engagementService, EngagementType, EngagementUser } from '../services/engagementService'
import Pagination from '../components/Pagination'

const SITE_URL = 'https://www.bibaho.org'

const TYPES: Record<EngagementType, { label: string; verb: string; icon: React.ElementType; description: string }> = {
  favorites: { label: 'Favorites', verb: 'liked', icon: HeartIcon, description: 'Members who added a biodata to their favorites (পছন্দের তালিকা).' },
  shortlists: { label: 'Shortlists', verb: 'shortlisted', icon: BookmarkIcon, description: 'Members who shortlisted a biodata to follow up later.' },
  reactions: { label: 'Reactions', verb: 'reacted to', icon: FaceSmileIcon, description: 'Reactions members left on biodatas.' },
  dislikes: { label: 'Dislikes', verb: 'ignored', icon: HandThumbDownIcon, description: 'Biodatas members ignored (অপছন্দের তালিকা).' },
}

const REACTION_EMOJI: Record<string, string> = { like: '👍', love: '❤️', wow: '😮', sad: '😢', angry: '😠', dislike: '👎' }

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const Person: React.FC<{ user?: EngagementUser; linkToBiodata?: boolean }> = ({ user, linkToBiodata }) => {
  if (!user) return <span className="italic text-gray-400">deleted account</span>
  return (
    <div className="min-w-0">
      {linkToBiodata && user.user_id ? (
        <a href={`${SITE_URL}/biodata/${user.user_id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-800 hover:underline">
          #{user.user_id} ↗
        </a>
      ) : (
        <span className="font-semibold text-gray-900">#{user.user_id ?? '—'}</span>
      )}
      <div className="truncate text-xs text-gray-500">{user.email}</div>
    </div>
  )
}

const Engagement: React.FC = () => {
  const { type } = useParams<{ type: string }>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [reactionType, setReactionType] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const limit = 20
  const valid = type && type in TYPES
  const kind = (valid ? type : 'favorites') as EngagementType

  // TODO: switching tabs starts the new list from page 1 with no leftover filters.
  useEffect(() => {
    setPage(1)
    setSearch('')
    setReactionType('')
  }, [type])

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['engagement', kind, { page, search: debouncedSearch, reactionType }],
    queryFn: () => engagementService.list(kind, { page, limit, search: debouncedSearch, reaction_type: reactionType || undefined }),
    enabled: Boolean(valid),
    placeholderData: (previous) => previous,
  })

  if (!valid) return <Navigate to="/engagement/favorites" replace />
  const meta = TYPES[kind]
  const items = data?.data || []
  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Engagement</h1>
          <p className="mt-1 text-gray-500">{meta.description}</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <nav className="flex flex-wrap gap-2 rounded-lg bg-white p-2 shadow" aria-label="Engagement type">
        {(Object.keys(TYPES) as EngagementType[]).map((key) => {
          const Icon = TYPES[key].icon
          return (
            <Link
              key={key}
              to={`/engagement/${key}`}
              aria-current={kind === key ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                kind === key ? 'bg-green-800 text-white' : 'text-gray-600 hover:bg-green-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {TYPES[key].label}
            </Link>
          )
        })}
      </nav>

      {stats && (
        <div className="grid gap-4 md:grid-cols-[repeat(2,minmax(0,180px))_1fr]">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total {meta.label.toLowerCase()}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Last 7 days</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stats.last7}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Most {meta.verb} biodatas</p>
            {stats.top.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No data yet</p>
            ) : (
              <ol className="mt-2 flex flex-wrap gap-2">
                {stats.top.map((t, index) => (
                  <li key={t.biodata?._id || index}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch(String(t.biodata?.user_id ?? ''))
                        setPage(1)
                      }}
                      title="Show only this biodata"
                      className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-900 hover:bg-green-100"
                    >
                      #{t.biodata?.user_id ?? '—'}
                      <span className="rounded-full bg-green-800 px-1.5 text-xs text-white">{t.count}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Biodata no. or email (either side)…"
            className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-green-700 focus:ring-green-700"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        {kind === 'reactions' && stats && stats.byType.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[{ type: '', count: stats.total }, ...stats.byType].map((t) => (
              <button
                key={t.type || 'all'}
                type="button"
                onClick={() => {
                  setReactionType(t.type)
                  setPage(1)
                }}
                className={`rounded-full px-3 py-1 text-sm font-medium ${reactionType === t.type ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {t.type ? `${REACTION_EMOJI[t.type] || ''} ${t.type}` : 'All'} · {t.count}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <ArrowPathIcon className="h-10 w-10 animate-spin text-green-700" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Error loading {meta.label.toLowerCase()}</div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Biodata</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><Person user={item.member} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {kind === 'reactions' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                          {REACTION_EMOJI[item.reaction_type || ''] || ''} {item.reaction_type}
                        </span>
                      ) : (
                        meta.verb
                      )}
                    </td>
                    <td className="px-4 py-3"><Person user={item.biodata} linkToBiodata /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      {search ? 'No results for this search' : `No ${meta.label.toLowerCase()} yet`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data?.totalPages || 1} totalItems={data?.total ?? 0} pageSize={limit} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

export default Engagement
