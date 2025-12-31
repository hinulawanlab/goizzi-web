"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Activity, Globe, LogOut, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import Sidebar from "@/components/navigation/Sidebar";
import { auth } from "@/shared/singletons/firebase";

type PolicyItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const policyItems: PolicyItem[] = [
  {
    icon: ShieldCheck,
    title: "Access policies",
    description:
      "Role gating mirrors Firebase + Firestore rules so only the right staff see borrower/loan data."
  },
  {
    icon: Activity,
    title: "Audit instrumentation",
    description:
      "Every action emits ACTION_STARTED / ACTION_SUCCEEDED / ACTION_FAILED with screenName, actionName, and latency."
  },
  {
    icon: Globe,
    title: "Global compliance",
    description:
      "Offline edits are read-only, financial writes must wait for the cloud, and errors map to human-friendly codes."
  }
];

const complianceNotes = [
  "Idle → Working → Success/Failure states are enforced for every action so staff never wonder if a write landed.",
  "Inline validation blocks bad data (allocation totals, KYC, borrower identity) before submitting updates or payments.",
  "Errors such as AllocationMismatchError, ConflictError, and TransientNetworkError translate into readable messages."
];

export default function SettingsPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStaffCount, setActiveStaffCount] = useState<number | null>(null);
  const [activeBranchCount, setActiveBranchCount] = useState<number | null>(null);

  const refreshTimestamp = useMemo(
    () =>
      new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
      }),
    []
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadStats = async () => {
      try {
        const response = await fetch("/api/settings/stats", {
          cache: "no-store",
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error("Settings stats request failed.");
        }
        const data = (await response.json()) as {
          activeStaffCount?: number;
          activeBranchCount?: number;
        };

        if (!isMounted) {
          return;
        }

        setActiveStaffCount(typeof data.activeStaffCount === "number" ? data.activeStaffCount : null);
        setActiveBranchCount(typeof data.activeBranchCount === "number" ? data.activeBranchCount : null);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.warn("Unable to load settings stats:", err);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const quickStats = useMemo(
    () => [
      {
        label: "Active staff",
        value: activeStaffCount === null ? "—" : activeStaffCount.toString(),
        caption: "Realtime identities via Firebase"
      },
      {
        label: "Branches monitored",
        value: activeBranchCount === null ? "—" : activeBranchCount.toString(),
        caption: "Shared borrower lines"
      },
      { label: "Config snapshot", value: refreshTimestamp, caption: "Synced from appConfig constants" }
    ],
    [activeBranchCount, activeStaffCount, refreshTimestamp]
  );

  const handleLogout = async () => {
    if (isSigningOut) {
      return;
    }

    setError(null);
    setIsSigningOut(true);

    try {
      await fetch("/api/session", { method: "DELETE" });
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      setError("Unable to sign out right now. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <Sidebar />
      <div className="mx-auto w-full max-w-8xl">
        <main className="space-y-6 pl-72">
          <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.6em] text-slate-400">System control</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings &amp; audit hub</h1>
              <p className="text-sm text-slate-600">
                Keep the Goizzi CMS policies consistent with the UI feedback contract, audit logging, and MVVM-inspired
                service boundaries.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {quickStats.map(({ label, value, caption }) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{caption}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-lg lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.6em] text-slate-400">Session controls</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">End your session securely</h2>
              <p className="mt-1 text-sm text-slate-600">
                Signing out clears Firebase Auth state and returns you to the login screen; this is the recommended way to
                ensure fresh audit context for the next staff member.
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.4em] text-slate-400">
                Last refresh: {refreshTimestamp}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="cursor-pointer flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#294a93] to-[#1e2a67] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {isSigningOut ? "Signing out..." : "Log out"}
              </button>
              {error && (
                <div role="status" aria-live="polite" className="text-sm text-rose-500">
                  {error}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
