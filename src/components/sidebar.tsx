"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, Users, Settings, Hexagon, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/auth/actions";
import { NAV, UI } from "@/lib/strings";

const LINKS = [
  { href: "/dashboard", label: NAV.dashboard, icon: LayoutDashboard },
  { href: "/tasks",     label: NAV.tasks,     icon: ListTodo },
  { href: "/clients",   label: NAV.clients,   icon: Users },
  { href: "/settings",  label: NAV.settings,  icon: Settings },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col border-border bg-panel/70 backdrop-blur-xl md:h-dvh md:w-60 md:border-r">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <motion.div
          className="tf-glow flex h-8 w-8 items-center justify-center rounded-xl border border-accent/30 bg-accent-soft text-accent-fg"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Hexagon size={18} />
        </motion.div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">
            Task<span className="text-accent-fg tf-cursor">Forge</span>
          </p>
          <p className="font-mono text-[10px] text-muted">{UI.version} · {UI.console}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {LINKS.map(({ href, label, icon: Icon }, i) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className="relative">
              {/* Sliding active indicator */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-accent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                )}
              </AnimatePresence>
              <motion.span
                style={{ animationDelay: `${i * 55}ms` }}
                whileHover={{ x: active ? 0 : 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "tf-ring tf-rise flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium",
                  "transition-colors duration-150",
                  active
                    ? "bg-accent-soft text-accent-fg pl-4"
                    : "text-muted hover:bg-panel-2 hover:text-fg",
                )}
              >
                <Icon size={17} />
                {label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="hidden border-t border-border px-3 py-3 md:block">
        <div className="truncate px-2 pb-2 font-mono text-[11px] text-muted">{email}</div>
        <form action={signOut}>
          <motion.button
            type="submit"
            whileHover={{ x: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="tf-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-rose-soft hover:text-rose"
          >
            <LogOut size={17} />
            {NAV.signOut}
          </motion.button>
        </form>
      </div>
    </aside>
  );
}
