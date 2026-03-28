import React from 'react'

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-500">Platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Endpoints Info */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🌐 API Configuration</h2>
          <div className="space-y-3 text-sm">
            <InfoRow label="Production API" value="https://server.pncnikah.com" />
            <InfoRow label="Admin API" value="/api/admin/*" />
            <InfoRow label="User API" value="/api/v1/user-info/*" />
            <InfoRow label="Biodata API" value="/api/v1/general-info, /api/v1/bio-data/*" />
            <InfoRow label="Payment API" value="/api/v1/payments/*" />
            <InfoRow label="bKash API" value="/api/v1/bkash/*" />
            <InfoRow label="Contact Purchase" value="/api/v1/contact-purchase-data/*" />
          </div>
        </div>

        {/* User Statuses */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 User Status Values</h2>
          <div className="space-y-2 text-sm">
            <StatusInfo label="active" desc="User is fully active" color="green" />
            <StatusInfo label="inactive" desc="User deactivated" color="gray" />
            <StatusInfo label="in review" desc="Under admin review" color="blue" />
            <StatusInfo label="pending" desc="Waiting for approval" color="yellow" />
            <StatusInfo label="banned" desc="User is banned" color="red" />
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 Points System</h2>
          <div className="space-y-2 text-sm">
            <InfoRow label="৳30" value="35 points" />
            <InfoRow label="৳100" value="120 points" />
            <InfoRow label="৳300" value="345 points" />
            <InfoRow label="৳500" value="560 points" />
            <div className="border-t pt-2 mt-3">
              <InfoRow label="Contact Purchase Cost" value="70 points" />
            </div>
          </div>
        </div>

        {/* Admin Emails */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📧 Admin Notifications</h2>
          <div className="space-y-2 text-sm">
            <InfoRow label="Admin Email 1" value="anis.cse5.bu@gmail.com" />
            <InfoRow label="Admin Email 2" value="rahat.cse5.bu@gmail.com" />
            <p className="text-xs text-gray-500 mt-3">Admin notifications are sent when users change status, submit biodatas for review, or make purchases.</p>
          </div>
        </div>

        {/* Biodata Statuses */}
        <div className="bg-white shadow rounded-xl p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Biodata Admin Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <StatusInfo label="approved" desc="Biodata is live and visible" color="green" />
            <StatusInfo label="rejected" desc="Biodata rejected, needs edits" color="red" />
            <StatusInfo label="banned" desc="Biodata permanently hidden" color="red" />
            <StatusInfo label="blocked" desc="Biodata temporarily blocked" color="orange" />
          </div>
        </div>
      </div>
    </div>
  )
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
)

const StatusInfo: React.FC<{ label: string; desc: string; color: string }> = ({ label, desc, color }) => {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
  }
  return (
    <div className="flex items-start gap-2">
      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colorClasses[color] || colorClasses.gray}`}>{label}</span>
      <span className="text-gray-500 text-xs">{desc}</span>
    </div>
  )
}

export default Settings
