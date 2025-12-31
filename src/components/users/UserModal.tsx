// src/components/users/UserModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import type { BranchSummary } from "@/shared/types/branch";
import type { UserRole, UserStatus, UserSummary } from "@/shared/types/user";

type FormState = "idle" | "working" | "success" | "error";

interface UserModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  user?: UserSummary | null;
  branches: BranchSummary[];
  onClose: () => void;
  onSave: (user: UserSummary) => void;
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "team lead", label: "Team Lead" },
  { value: "team member", label: "Team Member" },
  { value: "auditor", label: "Auditor" }
];

const statusOptions: { value: UserStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspend", label: "Suspend" }
];

function getPasswordIssues(value: string): string[] {
  const issues: string[] = [];
  if (value.length < 12) {
    issues.push("At least 12 characters");
  }
  if (!/[A-Z]/.test(value)) {
    issues.push("One uppercase letter");
  }
  if (!/[a-z]/.test(value)) {
    issues.push("One lowercase letter");
  }
  if (!/[0-9]/.test(value)) {
    issues.push("One number");
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    issues.push("One symbol");
  }
  return issues;
}

function buildBranchOptions(branches: BranchSummary[]) {
  return branches.map((branch) => ({
    value: branch.branchId,
    label: branch.name
  }));
}

export default function UserModal({ isOpen, mode, user, branches, onClose, onSave }: UserModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("team member");
  const [status, setStatus] = useState<UserStatus>("active");
  const [branchId, setBranchId] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [formMessage, setFormMessage] = useState("");

  const branchOptions = useMemo(() => buildBranchOptions(branches), [branches]);
  const branchNameLookup = useMemo(() => new Map(branches.map((branch) => [branch.branchId, branch.name])), [branches]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setDisplayName(user?.displayName ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "team member");
    setStatus(user?.status ?? "active");
    setBranchId(user?.branchId ?? "");
    setPassword("");
    setIsPasswordVisible(false);
    setFormState("idle");
    setFormMessage("");
  }, [isOpen, user]);

  if (!isOpen) {
    return null;
  }

  const isWorking = formState === "working";
  const isCreate = mode === "create";
  const passwordIssues = password.trim().length ? getPasswordIssues(password) : [];
  const hasPasswordError = isCreate ? passwordIssues.length > 0 : password.trim().length > 0 && passwordIssues.length > 0;
  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    branchId.trim().length > 0 &&
    !hasPasswordError &&
    (isCreate ? password.trim().length > 0 : true);

  const submitForm = async () => {
    if (!canSubmit) {
      setFormState("error");
      setFormMessage(hasPasswordError ? "Password does not meet the requirements." : "Please complete all required fields.");
      return;
    }

    setFormState("working");
    setFormMessage(isCreate ? "Creating user..." : "Updating user...");

    try {
      const payload = {
        displayName,
        email,
        role,
        status,
        branchId,
        branchName: branchNameLookup.get(branchId) ?? branchId,
        password: password.trim().length ? password : undefined
      };

      const response = await fetch(isCreate ? "/api/users" : `/api/users/${user?.userId ?? ""}`, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as { user?: UserSummary; error?: string };
      if (!response.ok || !body.user) {
        throw new Error(body.error ?? "Unable to save user.");
      }

      onSave(body.user);
      setFormState("success");
      setFormMessage(isCreate ? "User created successfully." : "User updated successfully.");
      if (isCreate) {
        setPassword("");
      }
    } catch (error) {
      console.warn("User save failed:", error);
      setFormState("error");
      setFormMessage("Unable to save user. Please retry.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/60"
        aria-label="Close user modal"
      />
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">User access</p>
            <h3 className="text-xl font-semibold text-slate-900">{isCreate ? "Create staff account" : "Edit staff account"}</h3>
            <p className="text-sm text-slate-500">Create Firebase Auth credentials and sync the staff profile.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 hover:border-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Full name</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              placeholder="Full name"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              placeholder="name@goizzi.com"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as UserStatus)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Branch</span>
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="">Select branch</option>
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {isCreate ? "Temporary password" : "New password (optional)"}
            </span>
            <div className="relative">
              <input
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-20 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder={isCreate ? "Set a strong temporary password" : "Leave blank to keep current password"}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                title={isPasswordVisible ? "Hide password" : "Show password"}
              >
                {isPasswordVisible ? "Hide" : "Show"}
              </button>
            </div>
            <div className="space-y-1 text-xs text-slate-400">
              <p>Password requirements:</p>
              <p>At least 12 characters, plus uppercase, lowercase, number, and symbol.</p>
            </div>
            {hasPasswordError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {passwordIssues.join(", ")}.
              </div>
            )}
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            {formState === "working" && "Saving changes..."}
            {formState === "success" && formMessage}
            {formState === "error" && formMessage}
          </div>
          <button
            type="button"
            onClick={submitForm}
            disabled={!canSubmit || isWorking}
            className={`rounded-full border px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              !canSubmit || isWorking
                ? "cursor-not-allowed border-slate-200 text-slate-300"
                : "cursor-pointer border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
            }`}
          >
            {isWorking ? "Saving..." : isCreate ? "Create user" : "Update user"}
          </button>
        </div>
      </div>
    </div>
  );
}
