"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { auth } from "@/shared/singletons/firebase";

const GOIZZI_LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/goizzi.firebasestorage.app/o/Goizzi%2FGoizzi_logo.png?alt=media&token=a1471e22-d944-48e6-a0f0-5c33420e9129";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const sessionResponse = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      if (!sessionResponse.ok) {
        await signOut(auth);
        setError("Access denied. Your account is not authorized for Goizzi CMS.");
        return;
      }

      setMessage("Authenticated, redirecting...");
      router.push("/borrowers");
    } catch (err) {
      setError("Unable to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#39489f] via-[#324a9a] to-[#1e2a67] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-8 shadow-glow">
        <Image
          src={GOIZZI_LOGO_URL}
          alt="Goizzi logo"
          width={90}
          height={90}
          className="mx-auto mb-4 h-16 w-auto object-contain"
          priority
        />
        <p className="text-sm uppercase tracking-[0.5em] text-white/40">Goizzi</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Goizzi CMS Login</h1>
        <p className="mt-1 text-sm text-slate-600">Secure staff access to borrower operations.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm text-slate-700">
            <span className="font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#294a93] focus:outline-none focus:ring-2 focus:ring-[#294a93]/50"
              placeholder="you@company.com"
            />
          </label>
          <label className="block space-y-1 text-sm text-slate-700">
            <span className="font-medium">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#294a93] focus:outline-none focus:ring-2 focus:ring-[#294a93]/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-100/80 p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e2a67]/70"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-linear-to-r from-[#294a93] to-[#1e2a67] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
      </div>
    </div>
  );
}
