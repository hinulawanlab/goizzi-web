// src/components/navigation/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Building,
  ChartBar,
  LayoutGrid,
  ShieldCheck,
  Settings,
  Users
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: ChartBar },
  { label: "Borrowers", href: "/borrowers", icon: Users },
  { label: "Queues", href: "/queues", icon: LayoutGrid },
  { label: "Branches", href: "/branches", icon: Building },
  { label: "Users & Roles", href: "/users", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-4 top-8 bottom-8 z-20 flex w-64 flex-col gap-6 rounded-3xl bg-linear-to-b from-slate-950/90 to-slate-900/60 px-4 py-6 shadow-glow ring-1 ring-white/20 backdrop-blur-lg">
      <div className="pointer-events-none absolute -top-6 right-4 h-24 w-24 rounded-full bg-linear-to-br from-sky-500/60 via-purple-500/10 to-transparent opacity-80 blur-[80px] animate-[pulse_6s_ease-in-out_infinite] will-change-transform" />
      <div className="flex flex-col gap-1 px-1 text-white">
        <span className="text-2xl font-semibold uppercase tracking-[0.4em] text-white/60">
          Goizzi
        </span>
        <p className="text-xs font-thin text-white">Customer Management System</p>
      </div>

      <div className="flex flex-col gap-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname?.startsWith(href);
          const baseLink =
            "group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/5 px-4 py-3 pl-10 text-sm font-semibold transition duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transform";
          const activeStyles =
            "bg-white/85 text-slate-900 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.9)] shadow-slate-900/70";
          const inactiveStyles =
            "text-white/70 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_15px_50px_-25px_rgba(14,165,233,0.55)] focus-visible:outline-white/50 motion-safe:hover:-translate-y-0.5";

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`${baseLink} ${isActive ? activeStyles : inactiveStyles}`}
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute left-2 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full transition ${
                  isActive
                    ? "bg-linear-to-b from-sky-400 to-violet-500 opacity-100"
                    : "bg-transparent opacity-0"
                }`}
              />
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl transition duration-300 ease-out ${
                  isActive
                    ? "bg-slate-900 text-white shadow-[0_15px_40px_-30px_rgba(15,23,42,0.9)]"
                    : "bg-white/10 text-white/70 motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105 group-hover:bg-linear-to-br group-hover:from-sky-500/25 group-hover:via-white/10 group-hover:to-transparent group-focus-visible:bg-linear-to-br group-focus-visible:from-sky-500/25 group-focus-visible:via-white/10 group-focus-visible:to-transparent"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-[12px] text-white/60">
        <p className="text-sm text-white">Realtime insights</p>
        <p className="text-[11px] text-white/40">Updated 2 minutes ago</p>
      </div>
    </nav>
  );
}
