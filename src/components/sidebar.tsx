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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent-fg">
          <Hexagon size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">
            Task<span className="text-accent-fg">Forge</span>
          </p>
          <p className="font-mono text-[10px] text-muted">v1.0 · console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "tf-ring flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent-fg shadow-[inset_0_0_0_1px_rgba(124,108,255,0.3)]"
                  : "text-muted hover:bg-panel-2 hover:text-fg",
              )}
            >
              <Icon size={17} />
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
            className="tf-ring flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-rose/10 hover:text-rose"
          >
            <LogOut size={17} />
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  );
}
