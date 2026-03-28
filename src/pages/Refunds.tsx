import React, { useState } from 'react'
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { refundService } from '../services/refundService'
import { toast } from 'react-toastify'

const Refunds: React.FC = () => {
  const [trxID, setTrxID] = useState('')
  const [paymentID, setPaymentID] = useState('')
  const [amount, setAmount] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [refundResult, setRefundResult] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)

  const handleSearch = async () => {
    if (!trxID.trim()) { toast.error('Enter a transaction ID'); return }
    setIsSearching(true)
    setSearchResult(null)
    try {
      const res = await refundService.searchBkash(trxID.trim())
      setSearchResult(res)
      // Auto-fill paymentID if found
      if (res?.paymentID) setPaymentID(res.paymentID)
      if (res?.amount) setAmount(res.amount)
      toast.success('Transaction found')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Transaction search failed')
      setSearchResult({ error: true })
    } finally {
      setIsSearching(false)
    }
  }

  const handleRefund = async () => {
    if (!paymentID.trim() || !trxID.trim() || !amount.trim()) {
      toast.error('All fields are required for refund')
      return
    }
    setIsRefunding(true)
    setRefundResult(null)
    try {
      const res = await refundService.refundBkash({ paymentID: paymentID.trim(), trxID: trxID.trim(), amount: amount.trim() })
      setRefundResult(res)
      toast.success('Refund processed successfully')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Refund failed')
      setRefundResult({ error: true, message: err?.response?.data?.message || 'Refund failed' })
    } finally {
      setIsRefunding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">bKash Refunds</h1>
        <p className="mt-1 text-gray-500">Search bKash transactions and process refunds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Transaction */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search bKash Transaction</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (trxID)</label>
              <div className="flex gap-2">
                <input type="text" className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Enter bKash trxID..." value={trxID} onChange={e => setTrxID(e.target.value)} />
                <button onClick={handleSearch} disabled={isSearching} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                  {isSearching ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <MagnifyingGlassIcon className="h-4 w-4" />}
                  Search
                </button>
              </div>
            </div>

            {searchResult && !searchResult.error && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-1">
                <h4 className="font-semibold text-green-800">Transaction Found</h4>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-60">{JSON.stringify(searchResult, null, 2)}</pre>
              </div>
            )}
            {searchResult?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">Transaction not found or search failed</div>
            )}
          </div>
        </div>

        {/* Process Refund */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💸 Process bKash Refund</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment ID</label>
              <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="bKash paymentID" value={paymentID} onChange={e => setPaymentID(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="bKash trxID" value={trxID} onChange={e => setTrxID(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (BDT)</label>
              <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 300" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <button onClick={handleRefund} disabled={isRefunding} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {isRefunding && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              Process Refund
            </button>

            {refundResult && !refundResult.error && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                <h4 className="font-semibold text-green-800">Refund Successful</h4>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-60">{JSON.stringify(refundResult, null, 2)}</pre>
              </div>
            )}
            {refundResult?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{refundResult.message || 'Refund failed'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>How it works:</strong> Search for a bKash transaction first, then use the Payment ID and amount to process a refund.
        Points mapping: ৳30→35pts, ৳100→120pts, ৳300→345pts, ৳500→560pts.
      </div>
    </div>
  )
}

export default Refunds
