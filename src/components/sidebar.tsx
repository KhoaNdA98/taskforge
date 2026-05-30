"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Settings,
  Hexagon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/auth/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/clients", label: "Khách hàng", icon: Users },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col border-border bg-panel/60 backdrop-blur-sm md:h-dvh md:w-60 md:border-r">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="tf-glow flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent-fg transition-transform duration-200 hover:scale-110">
          <Hexagon size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">
            Task<span className="text-accent-fg tf-cursor">Forge</span>
          </p>
          <p className="font-mono text-[10px] text-muted">v1.0 · console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {NAV.map(({ href, label, icon: Icon }, i) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{ animationDelay: `${i * 60}ms` }}
              className={cn(
                "tf-rise tf-ring group relative flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-3 text-sm font-medium",
                "transition-all duration-200",
                active
                  ? "bg-accent-soft text-accent-fg"
                  : "text-muted hover:bg-panel-2 hover:text-fg",
              )}
            >
              {/* Left border indicator */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full bg-accent transition-all duration-300",
                  active ? "h-5 opacity-100" : "h-0 opacity-0",
                )}
              />
              <Icon
                size={17}
                className={cn(
                  "transition-transform duration-200",
                  active ? "text-accent-fg" : "group-hover:scale-110",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="hidden border-t border-border px-3 py-3 md:block">
        <div className="truncate px-2 pb-2 font-mono text-[11px] text-muted">
          {email}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="tf-ring group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-all duration-200 hover:bg-rose/10 hover:text-rose"
          >
            <LogOut size={17} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  );
}
