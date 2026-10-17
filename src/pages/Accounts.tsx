import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BanknotesIcon, ArrowPathIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { AccountEntry, AccountEntryInput, accountsService, EntryType } from '../services/accountsService';

const labels: Record<EntryType, string> = { expense: 'Expense', income: 'Money received', investment: 'Investment' };
const colors: Record<EntryType, string> = {
  expense: 'bg-rose-50 text-rose-700', income: 'bg-emerald-50 text-emerald-700', investment: 'bg-blue-50 text-blue-700',
};
const money = (value: number) => `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const emptyForm = (): AccountEntryInput => ({ type: 'expense', amount: '', date: format(new Date(), 'yyyy-MM-dd'), category: '', person: '', notes: '' });
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700';

export default function Accounts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AccountEntryInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['accounts', { page, type, search }],
    queryFn: () => accountsService.list({ page, type, search }),
  });
  const save = useMutation({
    mutationFn: ({ id, entry }: { id: string | null; entry: AccountEntryInput }) =>
      id ? accountsService.update(id, entry) : accountsService.create(entry),
    onSuccess: (_result, variables) => {
      toast.success(variables.id ? 'Entry updated' : 'Entry recorded');
      setEditingId(null);
      setForm(emptyForm());
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Could not save the entry. Please try again.');
    },
  });

  const update = (key: keyof AccountEntryInput, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const edit = (entry: AccountEntry) => {
    setEditingId(entry._id);
    setForm({ type: entry.type, amount: entry.amount.toFixed(2), date: entry.date, category: entry.category, person: entry.person, notes: entry.notes });
    document.getElementById('entry-form-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (save.isPending) return;
    save.mutate({ id: editingId, entry: form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-green-100 p-3 text-green-800"><BanknotesIcon className="h-6 w-6" /></span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">Record business expenses, money received, and investments in BDT.</p>
        </div>
      </div>

      {isError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Could not load accounts. Check your connection and try again.
          <button type="button" onClick={() => refetch()} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ['Money received', 'income', 'text-emerald-700'],
          ['Investments', 'investment', 'text-blue-700'],
          ['Expenses', 'expense', 'text-rose-700'],
          ['Available balance', 'balance', 'text-slate-900'],
        ] as const).map(([label, key, color]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p data-testid={`total-${key}`} className={`mt-2 break-words text-2xl font-bold ${color}`}>
              {data && !isError ? money(data.summary[key]) : '—'}
            </p>
            <p className="mt-2 text-xs text-slate-400">All recorded entries</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Balance = money received + investments − expenses. Investments are funds contributed to the business. Website payments are not automatically included.</p>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="entry-form-title">
        <h2 id="entry-form-title" className="text-lg font-semibold text-slate-900">{editingId ? 'Edit entry' : 'Add entry'}</h2>
        <form onSubmit={submit} className="mt-4">
          <fieldset disabled={save.isPending} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 disabled:opacity-60">
            <label className="text-sm font-medium text-slate-700">Entry type
              <select className={inputClass} value={form.type} onChange={(event) => update('type', event.target.value)}>
                {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Amount (BDT)
              <input className={inputClass} type="number" min="0.01" max="999999999.99" step="0.01" required value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="0.00" />
            </label>
            <label className="text-sm font-medium text-slate-700">Date
              <input className={inputClass} type="date" required value={form.date} onChange={(event) => update('date', event.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-700">Category
              <input className={inputClass} required maxLength={100} value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="e.g. Hosting, Office, Founder capital" />
            </label>
            <label className="text-sm font-medium text-slate-700">Person / source (optional)
              <input className={inputClass} maxLength={150} value={form.person} onChange={(event) => update('person', event.target.value)} placeholder="Who paid or received the money?" />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">Notes (optional)
              <textarea className={inputClass} rows={2} maxLength={1000} value={form.notes} onChange={(event) => update('notes', event.target.value)} />
            </label>
            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
              <button type="submit" className="rounded-lg bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:cursor-wait">
                {save.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Record entry'}
              </button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()); }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel edit</button>}
            </div>
          </fieldset>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="history-title">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <h2 id="history-title" className="text-lg font-semibold text-slate-900">Transaction history</h2>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <input aria-label="Search transactions" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Search category, person, notes" maxLength={150} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            <select aria-label="Filter by entry type" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
              <option value="">All entry types</option>
              {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
        {isLoading ? <div role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><ArrowPathIcon className="h-5 w-5 animate-spin" />Loading accounts…</div> : isError ? <p className="p-8 text-center text-sm text-slate-500">Transaction history is unavailable.</p> : !data?.entries.length ? (
          <div className="p-10 text-center text-sm text-slate-500">{search || type ? 'No entries match your filters.' : 'No entries yet. Record your first expense, income, or investment above.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Date', 'Type', 'Category / notes', 'Person / source', 'Amount (BDT)', 'Actions'].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.entries.map((entry) => <tr key={entry._id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">{entry.date}</td>
                  <td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${colors[entry.type]}`}>{labels[entry.type]}</span></td>
                  <td className="max-w-xs px-5 py-4"><p className="break-words font-medium text-slate-900">{entry.category}</p>{entry.notes && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-500">{entry.notes}</p>}</td>
                  <td className="max-w-xs break-words px-5 py-4 text-slate-600">{entry.person || '—'}</td>
                  <td className={`whitespace-nowrap px-5 py-4 font-semibold ${entry.type === 'expense' ? 'text-rose-700' : 'text-emerald-700'}`}>{entry.type === 'expense' ? '−' : '+'}{money(entry.amount)}</td>
                  <td className="px-5 py-4"><button type="button" disabled={save.isPending} onClick={() => edit(entry)} aria-label={`Edit ${entry.category}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-green-800 hover:bg-green-50 disabled:opacity-50"><PencilSquareIcon className="h-4 w-4" />Edit</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        {data && !isError && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
          <span>{data.pagination.totalItems} entries · Page {page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= data.pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>}
      </section>
    </div>
  );
}
