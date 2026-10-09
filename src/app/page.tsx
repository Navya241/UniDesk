import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Lock,
  Layers,
  BarChart,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const demoAccounts = [
    { role: "Student", email: "student@unidesk.edu", desc: "Report campus issues, track tickets, anonymous mode", badge: "Student" },
    { role: "Faculty", email: "faculty@unidesk.edu", desc: "Department queries, lab requirements & academic issues", badge: "Faculty" },
    { role: "IT Staff", email: "it.staff@unidesk.edu", desc: "Network & hardware queues, ticket claim & resolution", badge: "IT Support" },
    { role: "Hostel Staff", email: "hostel.staff@unidesk.edu", desc: "Room maintenance, mess food quality & warden oversight", badge: "Hostel" },
    { role: "Academic Staff", email: "academic.staff@unidesk.edu", desc: "Curriculum, exams, transcript & grade requests", badge: "Academics" },
    { role: "Library Staff", email: "library.staff@unidesk.edu", desc: "Book circulation, journal subscriptions & archives", badge: "Library" },
    { role: "System Admin", email: "admin@unidesk.edu", desc: "Real-time analytics, SLA thresholds & ticket reassignment", badge: "Super Admin" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white selection:bg-blue-500 selection:text-white flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30 bg-slate-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
              UniDesk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" className="bg-blue-600 hover:bg-blue-500">
                Access Portal <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Next-Generation University Helpdesk & Grievance Resolution</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
            Streamlined Campus Issue Resolution with{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              Intelligent Routing & SLA Escalation
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Empowering students, faculty, and university departments with deterministic keyword categorization,
            tamper-proof anonymous reporting, automated SLA breach escalations, and real-time database analytics.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/25 px-8 h-13 text-base">
                Launch Demo Portal <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-100">Deterministic Routing</h3>
              <p className="text-sm text-slate-400 mt-2">
                Automatic keyword suggestions map queries directly to IT, Hostel, Academics, Library, or Admin.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-100">Guaranteed Anonymity</h3>
              <p className="text-sm text-slate-400 mt-2">
                Server-side DTO sanitization shields student identity while preserving auditability for administration.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-100">Automated SLA Escalation</h3>
              <p className="text-sm text-slate-400 mt-2">
                Configurable resolution timeouts trigger instant warnings, department alerts, and admin notifications.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <BarChart className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-100">Live Mathematical Analytics</h3>
              <p className="text-sm text-slate-400 mt-2">
                Real-time workload distribution, resolution rate calculations, and recurring issue keyword frequency.
              </p>
            </div>
          </div>
        </section>

        {/* Demo Accounts Quick-Login Card */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700 p-8 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-700/80">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Pre-configured Demo Accounts
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Click any account below or log in on the sign-in page to evaluate role-specific dashboards.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono">
                Standard Demo Password: <span className="text-blue-400 font-bold">[Role]@123</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {demoAccounts.map((acc) => (
                <Link
                  key={acc.email}
                  href={`/login?email=${encodeURIComponent(acc.email)}`}
                  className="group p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-950/20 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {acc.badge}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200 group-hover:text-white">
                    {acc.role}
                  </h4>
                  <p className="text-xs text-blue-300/80 font-mono mt-0.5">{acc.email}</p>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{acc.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
        <p>UniDesk &bull; University Helpdesk & Issue Resolution System &bull; B.Tech Major Project Edition</p>
      </footer>
    </div>
  );
}
