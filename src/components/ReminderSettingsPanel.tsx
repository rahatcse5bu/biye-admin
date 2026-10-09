import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { ReminderSettings, reminderSettingsService } from '../services/reminderSettingsService'

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500'

// TODO: admin limits for the reminder emails a sender can send the owner of a pending proposal.
const ReminderSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reminder-settings'],
    queryFn: reminderSettingsService.get,
  })
  const [form, setForm] = useState<ReminderSettings | null>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const saveMut = useMutation({
    mutationFn: (value: ReminderSettings) => reminderSettingsService.update(value),
    onSuccess: (saved) => {
      queryClient.setQueryData(['reminder-settings'], saved)
      toast.success('Reminder limits saved. Users see them within a minute.')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Failed to save reminder limits'),
  })

  if (isLoading || !form) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white p-6 text-gray-500 shadow">
        {isError ? (
          <span className="text-red-600">
            Failed to load reminder limits. <button onClick={() => refetch()} className="underline">Retry</button>
          </span>
        ) : (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading reminder limits...
          </>
        )}
      </div>
    )
  }

  const summary =
    form.max_emails === 0
      ? 'Reminder emails are turned off; the button is hidden for users.'
      : `Each sender can email the biodata owner up to ${form.max_emails} time${form.max_emails === 1 ? '' : 's'} per pending proposal` +
        (form.cooldown_hours ? `, at least ${form.cooldown_hours} hour${form.cooldown_hours === 1 ? '' : 's'} apart.` : ', with no wait in between.')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        saveMut.mutate(form)
      }}
      className="space-y-5 rounded-xl bg-white p-6 shadow"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">🔔 Proposal Reminder Emails</h2>
        <p className="mt-1 text-sm text-gray-500">
          After sending a proposal (first step), the sender can email the biodata owner a reminder while it is still pending.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reminder-max" className="mb-1 block text-sm font-medium text-gray-700">
            Emails per proposal
          </label>
          <input
            id="reminder-max"
            type="number"
            min={0}
            max={20}
            step={1}
            value={form.max_emails}
            onChange={(event) => setForm({ ...form, max_emails: Number(event.target.value) })}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">0 turns the feature off. Maximum 20.</p>
        </div>
        <div>
          <label htmlFor="reminder-cooldown" className="mb-1 block text-sm font-medium text-gray-700">
            Wait between emails (hours)
          </label>
          <input
            id="reminder-cooldown"
            type="number"
            min={0}
            max={720}
            step={1}
            value={form.cooldown_hours}
            onChange={(event) => setForm({ ...form, cooldown_hours: Number(event.target.value) })}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">0 means no wait. Maximum 720 (30 days).</p>
        </div>
      </div>

      <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">{summary}</p>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => data && setForm(data)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={saveMut.isPending}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saveMut.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
          Save Reminder Limits
        </button>
      </div>
    </form>
  )
}

export default ReminderSettingsPanel
