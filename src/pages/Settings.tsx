import React from 'react'
import { Link } from 'react-router-dom'
import EmailBrandingPanel from '../components/EmailBrandingPanel'
import ReminderSettingsPanel from '../components/ReminderSettingsPanel'

// TODO: only things an admin can change or needs to understand; developer details and copied-in prices were removed because they went stale.
const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-500">How emails look, which ones go out, and reminder rules.</p>
        <nav aria-label="Settings sections" className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href="#email" className="rounded-full border border-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-50">Emails</a>
          <a href="#reminders" className="rounded-full border border-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-50">Reminders</a>
          <a href="#help" className="rounded-full border border-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-50">What statuses mean</a>
        </nav>
      </div>

      <section id="email" className="scroll-mt-20">
        <EmailBrandingPanel />
      </section>

      <section id="reminders" className="scroll-mt-20">
        <ReminderSettingsPanel />
      </section>

      <section id="help" className="scroll-mt-20 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 Member status</h2>
          <div className="space-y-2 text-sm">
            <StatusInfo label="active" desc="Can log in and use the site" color="green" />
            <StatusInfo label="pending" desc="Signed up, waiting for approval" color="yellow" />
            <StatusInfo label="in review" desc="An admin is checking the account" color="blue" />
            <StatusInfo label="inactive" desc="Turned off; can be turned back on" color="gray" />
            <StatusInfo label="banned" desc="Blocked from the site" color="red" />
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Biodata status</h2>
          <div className="space-y-2 text-sm">
            <StatusInfo label="approved" desc="Live and visible to members" color="green" />
            <StatusInfo label="rejected" desc="Sent back; the member must fix it" color="red" />
            <StatusInfo label="blocked" desc="Hidden for now; can be restored" color="orange" />
            <StatusInfo label="banned" desc="Hidden permanently" color="red" />
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Point prices are set in{' '}
            <Link to="/points-packages" className="font-medium text-green-800 underline">
              Money → Point packages
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  )
}

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
