"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  FileText,
  Gamepad2,
  LayoutDashboard,
  Settings,
  Trophy,
  Upload,
  Users,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/import", label: "Importar CSV", icon: Upload },
  { href: "/participants", label: "Participantes", icon: Users },
  { href: "/matches", label: "Jogos", icon: Gamepad2 },
  { href: "/rules", label: "Regras", icon: Settings },
  { href: "/sync", label: "Sincronização", icon: Wifi },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[#E5EDE0] flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#E5EDE0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#64C832] flex items-center justify-center shadow-sm">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1F16]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              Bolão FWC26
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest px-3 mb-3">
          Menu principal
        </p>
        <div className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#64C832] text-white shadow-sm"
                    : "text-[#4A5568] hover:bg-[#F4F7F2] hover:text-[#1A1F16]"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#E5EDE0]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E8F8DC] flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-[#64C832]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1A1F16]">Desenvolvido por</p>
            <p className="text-[11px] text-[#9CA3AF]">Fernando Fagundes</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1
          className="text-2xl font-bold text-[#1A1F16]"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-sm text-[#9CA3AF] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
