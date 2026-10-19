import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChartBarIcon,
  BanknotesIcon,
  UsersIcon,
  CreditCardIcon,
  CogIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  FolderOpenIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { contactMessageService } from "../services/contactMessageService";
import { biodataRevisionService } from "../services/biodataRevisionService";

type NavChild = {
  name: string;
  href: string;
  description?: string;
};

type NavItem = {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
};

const PENDING_BIODATAS_HREF = "/biodatas?status=pending";
const CONTACT_MESSAGES_HREF = "/contact-messages";
const BIODATA_CHANGES_HREF = "/biodata-changes";

// TODO: one link per page; old URLs like /moderation still route, they just aren't listed twice.
const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: ChartBarIcon },
  {
    name: "Biodatas",
    icon: DocumentTextIcon,
    children: [
      { name: "Waiting for review", href: PENDING_BIODATAS_HREF, description: "New biodatas to approve or reject" },
      { name: "Edits to approve", href: BIODATA_CHANGES_HREF, description: "Changes to published biodatas" },
      { name: "All biodatas", href: "/biodatas", description: "Search and manage every biodata" },
      { name: "Approved", href: "/verified-biodatas?status=approved", description: "Live on the website" },
      { name: "Featured", href: "/featured-biodatas?status=approved", description: "Shown on the homepage" },
      { name: "Unverified", href: "/unverified-biodatas?status=pending", description: "Submitted without an account" },
    ],
  },
  { name: "Messages", href: CONTACT_MESSAGES_HREF, icon: ChatBubbleLeftRightIcon },
  {
    name: "Members",
    icon: UsersIcon,
    children: [
      { name: "All members", href: "/users", description: "Find, edit or ban an account" },
      { name: "By status", href: "/user-status?status=active", description: "Active, pending, banned" },
      { name: "Admins", href: "/admins?role=admin", description: "Who can use this panel" },
    ],
  },
  {
    name: "Money",
    icon: CreditCardIcon,
    children: [
      { name: "Payments", href: "/transactions?status=all", description: "Every bKash payment" },
      { name: "Refunds", href: "/refunds", description: "Refund requests and manual refunds" },
      { name: "Featured requests", href: "/featured-requests", description: "Paid homepage spots to approve" },
      { name: "Contact purchases", href: "/contact-purchases", description: "Who bought whose contact" },
      { name: "Point packages", href: "/points-packages", description: "Prices shown on the website" },
    ],
  },
  { name: "Accounts", href: "/accounts", icon: BanknotesIcon },
  {
    name: "Activity",
    icon: BellIcon,
    children: [
      { name: "Favorites", href: "/engagement/favorites", description: "Biodatas members saved" },
      { name: "Shortlists", href: "/engagement/shortlists", description: "Members' shortlists" },
      { name: "Reactions", href: "/engagement/reactions", description: "Likes on biodatas" },
      { name: "Dislikes", href: "/engagement/dislikes", description: "Biodatas members hid" },
    ],
  },
  {
    name: "Website content",
    icon: FolderOpenIcon,
    children: [
      { name: "Blog", href: "/blogs", description: "Write and publish posts" },
      { name: "Photo card templates", href: "/templates", description: "Designs for shareable photo cards" },
      { name: "Proposal questions", href: "/default-questions", description: "Default questions by religion" },
      { name: "Uploads", href: "/uploads", description: "Member photo library" },
    ],
  },
  { name: "Settings", href: "/settings", icon: CogIcon },
];

const matchRoute = (
  location: { pathname: string; search: string },
  target: string,
) => {
  if (!target) return false;

  const [routePath, routeSearch = ""] = target.split("?");
  const currentSearch = location.search || "";
  const normalizedSearch = routeSearch ? `?${routeSearch}` : "";

  return location.pathname === routePath && currentSearch === normalizedSearch;
};

const Sidebar: React.FC<{
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
}> = ({ open, onClose, collapsed }) => {
  const location = useLocation();
  // TODO: key sits under "biodatas" so status changes on the Biodatas page refresh it too.
  const { data: pendingBiodatas = 0 } = useQuery({
    queryKey: ["biodatas", "pending-count"],
    queryFn: dashboardService.getPendingBiodataCount,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  // TODO: key sits under "biodata-revisions" so approving or rejecting on that page refreshes it.
  const { data: pendingChanges = 0 } = useQuery({
    queryKey: ["biodata-revisions", "pending-count"],
    queryFn: biodataRevisionService.pendingCount,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const biodataGroupTotal = pendingBiodatas + pendingChanges;
  const groupBadgeText = biodataGroupTotal > 99 ? "99+" : String(biodataGroupTotal);
  const changesBadgeText = pendingChanges > 99 ? "99+" : String(pendingChanges);
  const badgeText = pendingBiodatas > 99 ? "99+" : String(pendingBiodatas);
  // TODO: key sits under "contact-messages" so actions on the Messages page refresh the badge.
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["contact-messages", "unread-count"],
    queryFn: contactMessageService.unreadCount,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const messagesBadge = unreadMessages > 99 ? "99+" : String(unreadMessages);
  // TODO: start with only the current page's group open (plus Biodatas, the daily work) so the menu stays short.
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Biodatas: true });

  useEffect(() => {
    const activeGroup = navigation.find((item) =>
      item.children?.some((child) => matchRoute(location, child.href)),
    );
    if (!activeGroup) return;

    setExpandedGroups((groups) => ({ ...groups, [activeGroup.name]: true }));
  }, [location]);

  return (
    <aside
      id="admin-navigation"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-200 lg:static ${open ? "translate-x-0 visible" : "-translate-x-full"} lg:translate-x-0 lg:visible ${collapsed ? "w-20 lg:w-20" : "w-[260px] lg:w-[260px]"}`}
    >
      <div className="flex h-16 items-center border-b border-slate-200 px-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-800 text-xs font-bold tracking-[0.12em] text-white">
            বি
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Bibaho</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Admin
              </p>
            </div>
          )}
        </div>

      </div>

      {!collapsed && (
        <div className="px-5 pb-3 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
        </div>
      )}

      <nav className="flex-1 min-h-0 space-y-1.5 overflow-y-auto px-3 pb-2">
        {navigation.map((item) => {
          const isActive =
            (item.href &&
              (location.pathname === item.href ||
                (item.href !== "/" &&
                  location.pathname.startsWith(item.href)))) ||
            (item.children &&
              item.children.some((child) => matchRoute(location, child.href)));

          if (item.children) {
            const isExpanded = !collapsed && expandedGroups[item.name];

            return (
              <div
                key={item.name}
                className={`rounded-xl border ${isActive ? "border-green-100 bg-green-50" : "border-transparent bg-transparent"}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((groups) => ({
                      ...groups,
                      [item.name]: !groups[item.name],
                    }))
                  }
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-slate-700 transition hover:bg-green-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="relative flex-shrink-0">
                      <item.icon className="h-4 w-4 text-slate-500" />
                      {collapsed && item.name === "Biodatas" && biodataGroupTotal > 0 && (
                        <span
                          className="absolute -right-2.5 -top-2.5 min-w-[18px] rounded-full bg-amber-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-white"
                          title={`${pendingBiodatas} pending biodatas, ${pendingChanges} change requests`}
                        >
                          {groupBadgeText}
                        </span>
                      )}
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">
                        {item.name}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <span className="flex items-center gap-2">
                      {item.name === "Biodatas" && !isExpanded && biodataGroupTotal > 0 && (
                        <span
                          className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                          title={`${pendingBiodatas} pending biodatas, ${pendingChanges} change requests`}
                        >
                          {groupBadgeText}
                        </span>
                      )}
                      <ChevronDownIcon
                        className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                      />
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-1 px-2 pb-2">
                    {item.children.map((child) => {
                      const childActive = matchRoute(location, child.href);
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          onClick={onClose}
                          className={`block rounded-lg px-3 py-2 transition-colors ${
                            childActive
                              ? "bg-green-800 text-white shadow-sm"
                              : "text-slate-600 hover:bg-green-50 hover:text-green-900"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="block text-sm font-medium">
                              {child.name}
                            </span>
                            {child.href === PENDING_BIODATAS_HREF && pendingBiodatas > 0 && (
                              <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${childActive ? "bg-white text-green-800" : "bg-amber-500 text-white"}`}>
                                {badgeText}
                              </span>
                            )}
                            {child.href === BIODATA_CHANGES_HREF && pendingChanges > 0 && (
                              <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${childActive ? "bg-white text-green-800" : "bg-amber-500 text-white"}`}>
                                {changesBadgeText}
                              </span>
                            )}
                          </span>
                          {child.description && (
                            <span className="mt-1 block text-[11px] text-slate-500">
                              {child.description}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href || "/"}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? "justify-center px-0" : ""} ${
                isActive
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-green-50 hover:text-green-900"
              }`}
            >
              <span className="relative flex-shrink-0">
                <item.icon
                  className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`}
                />
                {collapsed && item.href === CONTACT_MESSAGES_HREF && unreadMessages > 0 && (
                  <span className="absolute -right-2.5 -top-2.5 min-w-[18px] rounded-full bg-amber-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
                    {messagesBadge}
                  </span>
                )}
              </span>
              {!collapsed && <span className="flex-1">{item.name}</span>}
              {!collapsed && item.href === CONTACT_MESSAGES_HREF && unreadMessages > 0 && (
                <span
                  className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-white text-green-800" : "bg-amber-500 text-white"}`}
                  title={`${unreadMessages} new messages`}
                >
                  {messagesBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
};

export default Sidebar;
