import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { EmailSettings, emailSettingsService } from '../services/emailSettingsService'

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500'

const PRESETS = ['Facebook', 'YouTube', 'Instagram', 'WhatsApp']

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || fallback

const EmailBrandingPanel: React.FC = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['email-settings'],
    queryFn: emailSettingsService.get,
  })
  const [form, setForm] = useState<EmailSettings | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [logoBroken, setLogoBroken] = useState(false)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  // TODO: debounced live preview of a real email built from the unsaved form.
  useEffect(() => {
    if (!form) return
    const timer = setTimeout(() => {
      emailSettingsService
        .preview(form)
        .then((html) => {
          setPreviewHtml(html)
          setPreviewError('')
        })
        .catch((error) => setPreviewError(errorMessage(error, 'Preview failed')))
    }, 500)
    return () => clearTimeout(timer)
  }, [form])

  const saveMut = useMutation({
    mutationFn: (value: EmailSettings) => emailSettingsService.update(value),
    onSuccess: (saved) => {
      queryClient.setQueryData(['email-settings'], saved)
      toast.success('Email branding saved. New emails use it within a minute.')
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to save email settings')),
  })

  if (isLoading || !form) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white p-6 text-gray-500 shadow">
        {isError ? (
          <span className="text-red-600">
            Failed to load email settings. <button onClick={() => refetch()} className="underline">Retry</button>
          </span>
        ) : (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading email settings...
          </>
        )}
      </div>
    )
  }

  const setLink = (index: number, key: 'label' | 'url', value: string) =>
    setForm({
      ...form,
      social_links: form.social_links.map((link, i) => (i === index ? { ...link, [key]: value } : link)),
    })
  const addLink = (label = '') =>
    setForm({ ...form, social_links: [...form.social_links, { label, url: '' }] })
  const removeLink = (index: number) =>
    setForm({ ...form, social_links: form.social_links.filter((_, i) => i !== index) })

  const unusedPresets = PRESETS.filter(
    (name) => !form.social_links.some((link) => link.label.toLowerCase() === name.toLowerCase()),
  )

  return (
    <div className="grid grid-cols-1 gap-6 rounded-xl bg-white p-6 shadow xl:grid-cols-2">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          saveMut.mutate(form)
        }}
        className="space-y-5"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">📨 Email Branding</h2>
          <p className="mt-1 text-sm text-gray-500">Logo and footer used in every email sent to users.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Logo URL</label>
          <input
            required
            type="url"
            className={inputClass}
            value={form.logo_url}
            onChange={(e) => {
              setLogoBroken(false)
              setForm({ ...form, logo_url: e.target.value })
            }}
            placeholder="https://..."
          />
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-14 min-w-[8rem] items-center justify-center rounded-lg bg-[#0D7377] px-3">
              {logoBroken ? (
                <span className="text-xs text-white/80">Image not found</span>
              ) : (
                <img src={form.logo_url} alt="Logo preview" className="h-10 w-auto" onError={() => setLogoBroken(true)} />
              )}
            </div>
            <p className="text-xs text-gray-500">Shown on the teal email header. A white or light logo works best. Use a public https link (e.g. Cloudinary).</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Support email (footer)</label>
          <input
            required
            type="email"
            className={inputClass}
            value={form.support_email}
            onChange={(e) => setForm({ ...form, support_email: e.target.value })}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Footer social links</label>
            <span className="text-xs text-gray-400">{form.social_links.length}/8</span>
          </div>
          {form.social_links.length === 0 && (
            <p className="mb-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">No social links. The footer shows only the support email.</p>
          )}
          <div className="space-y-2">
            {form.social_links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  required
                  maxLength={40}
                  className={`${inputClass} max-w-[9rem]`}
                  value={link.label}
                  onChange={(e) => setLink(index, 'label', e.target.value)}
                  placeholder="Name"
                />
                <input
                  required
                  type="url"
                  className={inputClass}
                  value={link.url}
                  onChange={(e) => setLink(index, 'url', e.target.value)}
                  placeholder="https://facebook.com/..."
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="rounded-md p-2 text-red-600 hover:bg-red-50"
                  aria-label={`Remove ${link.label || 'link'}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          {form.social_links.length < 8 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {unusedPresets.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addLink(name)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  + {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => addLink()}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Custom link
              </button>
            </div>
          )}
        </div>

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
            Save Email Branding
          </button>
        </div>
      </form>

      <div className="flex min-h-[28rem] flex-col">
        <p className="mb-2 text-sm font-medium text-gray-700">Live preview</p>
        {previewError ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
            {previewError}
          </div>
        ) : (
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            sandbox=""
            className="w-full flex-1 rounded-lg border border-gray-200"
          />
        )}
      </div>
    </div>
  )
}

export default EmailBrandingPanel
