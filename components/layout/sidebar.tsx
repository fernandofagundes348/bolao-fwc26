"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
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
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#E5EDE0] flex-col z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#E5EDE0]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#64C832] shadow-sm">
              <Trophy className="w-5 h-5 text-white" />
            </div>

            <div>
              <p
                className="text-sm font-bold text-[#1A1F16]"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                Bolão FWC26
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
            Menu principal
          </p>

          <div className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-[#64C832] text-white shadow-sm"
                      : "text-[#4A5568] hover:bg-[#F4F7F2] hover:text-[#1A1F16]"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E5EDE0]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E8F8DC]">
              <BarChart3 className="w-4 h-4 text-[#64C832]" />
            </div>

            <div>
              <p className="text-xs font-bold text-[#1A1F16]">
                Desenvolvido por
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                Fernando Fagundes
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex bg-white border-t border-[#E5EDE0] md:hidden">
        {navItems.map(({ href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 items-center justify-center py-3 transition-colors",
                isActive
                  ? "text-[#64C832]"
                  : "text-[#9CA3AF]"
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>
    </>
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
    <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between md:mb-8">
      <div>
        <h1
          className="text-xl font-bold text-[#1A1F16] md:text-2xl"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}