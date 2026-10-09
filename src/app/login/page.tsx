"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = React.useState(searchParams.get("email") || "");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const DEMO_USERS = [
    { label: "Student", email: "student@unidesk.edu", pass: "Student@123", role: "Student" },
    { label: "Faculty", email: "faculty@unidesk.edu", pass: "Faculty@123", role: "Faculty" },
    { label: "IT Staff", email: "it.staff@unidesk.edu", pass: "Staff@123", role: "IT Support" },
    { label: "Hostel Staff", email: "hostel.staff@unidesk.edu", pass: "Staff@123", role: "Hostel Dept" },
    { label: "Library Staff", email: "library.staff@unidesk.edu", pass: "Staff@123", role: "Library" },
    { label: "Academic Staff", email: "academic.staff@unidesk.edu", pass: "Staff@123", role: "Academics" },
    { label: "Admin", email: "admin@unidesk.edu", pass: "Admin@123", role: "Super Admin" },
  ];

  const handleSelectDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-border/80">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="University Email"
            id="email"
            type="email"
            placeholder="name@unidesk.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          variant="primary"
          className="w-full mt-2 font-semibold shadow-lg shadow-primary/25"
          isLoading={isLoading}
        >
          Sign In to Portal <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </form>

      {/* Quick Demo Credentials Bar */}
      <div className="mt-8 pt-6 border-t border-border/70">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-primary" />
            Quick 1-Click Demo Accounts:
          </span>
          <span className="text-[10px] text-muted-foreground">Click to fill</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => handleSelectDemo(demo.email, demo.pass)}
              className={`p-2 rounded-xl text-left border text-xs transition-all ${
                email === demo.email
                  ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary"
                  : "border-border/80 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              <p className="font-semibold text-[11px] truncate text-foreground">{demo.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{demo.role}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            UniDesk
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-100">
          Sign in to University Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter your institutional credentials or use 1-click demo access
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg space-y-6">
        <React.Suspense fallback={
          <div className="bg-card/95 py-12 px-6 rounded-3xl border border-border/80 text-center text-muted-foreground text-sm">
            Loading authentication portal...
          </div>
        }>
          <LoginForm />
        </React.Suspense>

        <div className="text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            &larr; Back to UniDesk Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
