import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { defaultQuestionsService, Religion } from '../services/defaultQuestionsService'

const TABS: { key: Religion; label: string }[] = [
  { key: 'islam', label: 'ইসলাম' },
  { key: 'hinduism', label: 'হিন্দু' },
  { key: 'christianity', label: 'খ্রিষ্টান' },
]
const MAX_QUESTIONS = 10

const DefaultQuestions: React.FC = () => {
  const queryClient = useQueryClient()
  const [active, setActive] = useState<Religion>('islam')
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['default-bio-questions'],
    queryFn: defaultQuestionsService.list,
  })

  useEffect(() => {
    if (data.length) setDrafts(Object.fromEntries(data.map((set) => [set.religion, [...set.questions]])))
  }, [data])

  const saved = data.find((set) => set.religion === active)?.questions || []
  const questions = drafts[active] || []
  const dirty = JSON.stringify(saved) !== JSON.stringify(questions)

  const setQuestions = (next: string[]) => setDrafts((current) => ({ ...current, [active]: next }))

  const saveMut = useMutation({
    mutationFn: () =>
      defaultQuestionsService.update(
        active,
        questions.map((q) => q.trim()).filter(Boolean),
      ),
    onSuccess: () => {
      toast.success('Default questions saved. New visitors see them within a minute.')
      queryClient.invalidateQueries({ queryKey: ['default-bio-questions'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to save questions'),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Default Questions</h1>
        <p className="mt-1 text-gray-500">
          Questions proposers must answer, used for every biodata whose owner hasn't set their own. Chosen by the biodata's religion; biodatas without a religion use Islam.
        </p>
      </div>

      <div className="rounded-xl bg-white shadow">
        <div className="flex border-b border-gray-200" role="tablist">
          {TABS.map((tab) => {
            const changed = JSON.stringify(drafts[tab.key] || []) !== JSON.stringify(data.find((s) => s.religion === tab.key)?.questions || [])
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active === tab.key}
                onClick={() => setActive(tab.key)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
                  active === tab.key ? 'text-blue-700' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
                {changed && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" title="Unsaved changes" />}
                {active === tab.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600" />}
              </button>
            )
          })}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading questions...
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-red-600">
              Failed to load questions. <button onClick={() => refetch()} className="underline">Retry</button>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                saveMut.mutate()
              }}
              className="space-y-4"
            >
              {questions.map((question, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700" htmlFor={`q-${index}`}>
                      Question {index + 1}
                    </label>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    id={`q-${index}`}
                    required
                    rows={2}
                    maxLength={1000}
                    value={question}
                    onChange={(e) => setQuestions(questions.map((q, i) => (i === index ? e.target.value : q)))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuestions([...questions, ''])}
                  disabled={questions.length >= MAX_QUESTIONS}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4" /> Add question ({questions.length}/{MAX_QUESTIONS})
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestions([...saved])}
                    disabled={!dirty}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={!dirty || saveMut.isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saveMut.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    Save {TABS.find((t) => t.key === active)?.label} questions
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default DefaultQuestions
