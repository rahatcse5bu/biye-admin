import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bars3Icon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../store/authStore";
import Notifications from "./Notifications";

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "What needs attention and how the site is doing" },
  "/biodatas": { title: "Biodatas", description: "Search, review and manage biodatas" },
  "/verified-biodatas": { title: "Approved biodatas", description: "Biodatas live on the website" },
  "/featured-biodatas": { title: "Featured biodatas", description: "Biodatas shown on the homepage" },
  "/unverified-biodatas": { title: "Unverified biodatas", description: "Submitted without an account" },
  "/moderation": { title: "Unverified biodatas", description: "Submitted without an account" },
  "/biodata-changes": { title: "Edits to approve", description: "Changes members made to published biodatas" },
  "/contact-messages": { title: "Messages", description: "Sent from the website contact form" },
  "/users": { title: "Members", description: "Find, edit or ban an account" },
  "/user-status": { title: "Members by status", description: "Active, pending and banned accounts" },
  "/admins": { title: "Admins", description: "Who can use this panel" },
  "/payments": { title: "Payments", description: "Every bKash payment" },
  "/transactions": { title: "Payments", description: "Every bKash payment" },
  "/refunds": { title: "Refunds", description: "Refund requests and manual bKash refunds" },
  "/featured-requests": { title: "Featured requests", description: "Paid homepage spots to approve" },
  "/contact-purchases": { title: "Contact purchases", description: "Who bought whose contact details" },
  "/contact-requests": { title: "Contact purchases", description: "Who bought whose contact details" },
  "/points-packages": { title: "Point packages", description: "Prices shown on the website" },
  "/accounts": { title: "Accounts", description: "Business expenses, income and investments" },
  "/blogs": { title: "Blog", description: "Write and publish posts" },
  "/templates": { title: "Photo card templates", description: "Designs for shareable photo cards" },
  "/content-management": { title: "Photo card templates", description: "Designs for shareable photo cards" },
  "/default-questions": { title: "Proposal questions", description: "Default questions by religion" },
  "/uploads": { title: "Uploads", description: "Member photo library" },
  "/settings": { title: "Settings", description: "Emails and reminders" },
  "/system-settings": { title: "Settings", description: "Emails and reminders" },
};

const Header: React.FC<{
  onMenuToggle: () => void;
  menuOpen: boolean;
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}> = ({ onMenuToggle, menuOpen, onSidebarToggle, sidebarCollapsed }) => {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const page = PAGE_TITLES[location.pathname] ?? {
    title: location.pathname.startsWith("/engagement") ? "Activity" : "Admin Panel",
    description: location.pathname.startsWith("/engagement") ? "What members save, like and hide" : "Bibaho administration",
  };

  useEffect(() => {
    if (!profileOpen) return;

    const closeProfile = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", closeProfile);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeProfile);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuToggle}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <button
          onClick={onSidebarToggle}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 lg:inline-flex"
        >
          {sidebarCollapsed ? (
            <ChevronDoubleRightIcon className="h-5 w-5" />
          ) : (
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          )}
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">Workspace</span>
            <ChevronRightIcon className="hidden h-3 w-3 sm:block" />
            <span className="font-medium text-slate-800">{page.title}</span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">
            {page.description}
          </p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3 border-l border-slate-200 pl-4">
        <Notifications />
        <div ref={profileRef} className="relative flex items-center">
        <button
          type="button"
          onClick={() => setProfileOpen((open) => !open)}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-green-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-800 text-xs font-semibold text-white">
            {user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.user_name || "Admin"}</p>
            <p className="mt-0.5 text-xs capitalize text-slate-500">{user?.user_role || "admin"}</p>
          </div>
          <ChevronDownIcon className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`} />
        </button>

        {profileOpen && (
          <div role="menu" className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.email || "admin"}</p>
              <p className="mt-0.5 text-xs capitalize text-slate-500">{user?.user_role || "admin"}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => logout()}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-green-50 hover:text-green-900"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
};

export default Header;
