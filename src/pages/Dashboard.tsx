import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ArrowPathIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { dashboardService, DashboardStats } from "../services/dashboardService";
import EmailUsagePanel from "../components/EmailUsagePanel";

interface StatCard {
  name: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  href: string;
}

const StatCard: React.FC<StatCard> = ({
  name,
  value,
  sub,
  icon: Icon,
  iconBg,
  href,
}) => (
  <Link
    to={href}
    className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
    aria-label={`Open ${name}`}
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
          {name}
        </p>
        <p className="mt-3 text-2xl font-semibold text-slate-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="mt-1 text-xs text-slate-500">{sub}</p>
      </div>
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${iconBg}`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </Link>
);

const BreakdownRow: React.FC<{
  label: string;
  value: string | number;
  dot: string;
}> = ({ label, value, dot }) => (
  <div className="flex justify-between items-center py-1.5">
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-900">
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
  </div>
);

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bioStats, setBioStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [adminStats, bStats] = await Promise.allSettled([
          dashboardService.getStats(),
          dashboardService.getBioStats(),
        ]);
        if (adminStats.status === "fulfilled") setStats(adminStats.value);
        if (bStats.status === "fulfilled") setBioStats(bStats.value);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-slate-900" />
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

  const cards: StatCard[] = stats
    ? [
        {
          name: "Total Users",
          value: stats.users.total,
          sub: `${stats.users.active} active`,
          icon: UsersIcon,
          iconBg: "bg-green-800 text-white",
          href: "/users",
        },
        {
          name: "Total Biodatas",
          value: stats.biodatas.total,
          sub: `${stats.biodatas.verified} verified`,
          icon: DocumentTextIcon,
          iconBg: "bg-green-800 text-white",
          href: "/biodatas",
        },
        {
          name: "Revenue",
          value: `৳${stats.payments.revenue.toLocaleString()}`,
          sub: `${stats.payments.completed} completed`,
          icon: CreditCardIcon,
          iconBg: "bg-green-800 text-white",
          href: "/transactions?status=all",
        },
        {
          name: "Pending Payments",
          value: stats.payments.pending,
          sub: `${stats.payments.total} total`,
          icon: ClockIcon,
          iconBg: "bg-green-800 text-white",
          href: "/transactions?status=pending",
        },
      ]
    : bioStats
      ? [
          {
            name: "Total Biodatas",
            value: bioStats.total || 0,
            sub: "all submissions",
            icon: DocumentTextIcon,
            iconBg: "bg-green-800 text-white",
            href: "/biodatas",
          },
          {
            name: "পাত্রের বায়োডাটা",
            value: bioStats["পুরুষ"] || 0,
            sub: "male biodatas",
            icon: UsersIcon,
            iconBg: "bg-green-800 text-white",
            href: "/biodatas",
          },
          {
            name: "পাত্রীর বায়োডাটা",
            value: bioStats["মহিলা"] || 0,
            sub: "female biodatas",
            icon: UsersIcon,
            iconBg: "bg-green-800 text-white",
            href: "/biodatas",
          },
        ]
      : [];

  const pieData = stats
    ? [
        { name: "Active", value: stats.users.active, color: "#10B981" },
        { name: "Inactive", value: stats.users.inactive, color: "#F59E0B" },
        { name: "Banned", value: stats.users.banned, color: "#EF4444" },
        { name: "Pending", value: stats.users.pending, color: "#15803d" },
      ].filter((d) => d.value > 0)
    : [];

  const bioBarData = bioStats
    ? [
        { name: "পুরুষ", count: bioStats["পুরুষ"] || 0 },
        { name: "মহিলা", count: bioStats["মহিলা"] || 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Platform activity at a glance.
        </p>
      </div>
      {cards.length === 0 && (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
        >
          <DocumentTextIcon className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <h3 className="font-semibold text-slate-800">
            Statistics are unavailable
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Please reload the page to try again.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.name} {...c} />
        ))}
      </div>
      <EmailUsagePanel />
      {(pieData.length > 0 || bioBarData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {pieData.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">
                User Status
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Distribution across all accounts
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={95}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {bioBarData.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">
                Biodata Gender Split
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Male vs. female submissions
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bioBarData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: 10,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    <Cell fill="#15803d" />
                    <Cell fill="#94b8b2" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-white">
                <UsersIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Users Breakdown
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              <BreakdownRow
                label="Active"
                value={stats.users.active}
                dot="bg-emerald-400"
              />
              <BreakdownRow
                label="Inactive"
                value={stats.users.inactive}
                dot="bg-gray-300"
              />
              <BreakdownRow
                label="Pending"
                value={stats.users.pending}
                dot="bg-amber-400"
              />
              <BreakdownRow
                label="Banned"
                value={stats.users.banned}
                dot="bg-red-400"
              />
              <BreakdownRow
                label="New (30 days)"
                value={stats.users.recent}
                dot="bg-indigo-400"
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-white">
                <DocumentTextIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Biodatas</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <BreakdownRow
                label="Total"
                value={stats.biodatas.total}
                dot="bg-indigo-400"
              />
              <BreakdownRow
                label="Verified"
                value={stats.biodatas.verified}
                dot="bg-emerald-400"
              />
              <BreakdownRow
                label="Pending"
                value={stats.biodatas.pending}
                dot="bg-amber-400"
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-white">
                <CreditCardIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Payments</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <BreakdownRow
                label="Total"
                value={stats.payments.total}
                dot="bg-indigo-400"
              />
              <BreakdownRow
                label="Completed"
                value={stats.payments.completed}
                dot="bg-emerald-400"
              />
              <BreakdownRow
                label="Pending"
                value={stats.payments.pending}
                dot="bg-amber-400"
              />
              <BreakdownRow
                label="Revenue"
                value={`৳${stats.payments.revenue.toLocaleString()}`}
                dot="bg-violet-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
