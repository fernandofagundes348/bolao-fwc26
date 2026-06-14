"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, X } from "lucide-react";
import React, { useState } from "react";

// ─── Button ───────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:     "bg-[#64C832] hover:bg-[#52A828] text-white shadow-sm",
        secondary:   "bg-white hover:bg-[#F4F7F2] text-[#146E37] border border-[#E5EDE0]",
        ghost:       "bg-transparent hover:bg-[#F4F7F2] text-[#4A5568]",
        destructive: "bg-red-500 hover:bg-red-600 text-white",
        outline:     "border border-[#64C832] text-[#146E37] hover:bg-[#E8F8DC]",
        dark:        "bg-[#146E37] hover:bg-[#0F5529] text-white",
      },
      size: {
        sm:   "text-xs px-3 py-2 rounded-lg",
        md:   "text-sm px-5 py-2.5 rounded-xl",
        lg:   "text-base px-6 py-3 rounded-xl",
        icon: "p-2.5 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className, variant, size, loading, children, disabled, type = "button", ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-[#1A1F16]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-[#E5EDE0] bg-white px-4 py-2.5 text-sm text-[#1A1F16] placeholder:text-[#9CA3AF]",
            "focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all duration-200",
            error && "border-red-400 focus:border-red-400 focus:ring-red-200",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-[#1A1F16]">{label}</label>}
      <select
        className={cn(
          "w-full rounded-xl border border-[#E5EDE0] bg-white px-4 py-2.5 text-sm text-[#1A1F16]",
          "focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all duration-200 appearance-none cursor-pointer",
          error && "border-red-400",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-[#E5EDE0]",
        "shadow-[0_1px_3px_rgba(100,200,50,0.08)]",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = "green" | "gray" | "red" | "yellow" | "blue";

const badgeStyles: Record<BadgeVariant, string> = {
  green:  "bg-[#E8F8DC] text-[#146E37]",
  gray:   "bg-gray-100 text-gray-600",
  red:    "bg-red-50 text-red-600",
  yellow: "bg-yellow-50 text-yellow-700",
  blue:   "bg-blue-50 text-blue-700",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full",
        badgeStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const modalSizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full",
          "animate-[slideUp_0.25s_ease-out]",
          modalSizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5EDE0]">
          <h2
            className="text-lg font-bold text-[#1A1F16]"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-[#9CA3AF]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E5EDE0] bg-[#F4F7F2] rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, children }: DrawerProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E5EDE0]">
          <div>
            <h2
              className="text-lg font-bold text-[#1A1F16]"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              {title}
            </h2>
            {subtitle && <p className="text-sm text-[#9CA3AF] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors mt-0.5"
          >
            <X className="h-4 w-4 text-[#9CA3AF]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl",
        className
      )}
    />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#E8F8DC] flex items-center justify-center mb-4 text-[#64C832]">
        {icon}
      </div>
      <h3
        className="text-base font-bold text-[#1A1F16] mb-1"
        style={{ fontFamily: "'Exo 2', sans-serif" }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#9CA3AF] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const toastStyles: Record<ToastType, string> = {
  success: "bg-[#146E37] text-white",
  error:   "bg-red-600 text-white",
  info:    "bg-[#1A1F16] text-white",
};

let _listeners: ((t: ToastItem[]) => void)[] = [];
let _toasts: ToastItem[] = [];

function _update(list: ToastItem[]) {
  _toasts = list;
  _listeners.forEach((fn) => fn(list));
}

function _add(message: string, type: ToastType) {
  const id = Math.random().toString(36).slice(2);
  _update([..._toasts, { id, message, type }]);
  setTimeout(() => _update(_toasts.filter((t) => t.id !== id)), 3500);
}

export const toast = {
  success: (msg: string) => _add(msg, "success"),
  error:   (msg: string) => _add(msg, "error"),
  info:    (msg: string) => _add(msg, "info"),
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  React.useEffect(() => {
    _listeners.push(setToasts);
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold min-w-[280px]",
            "animate-[slideUp_0.25s_ease-out]",
            toastStyles[t.type]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = "Confirmar", loading,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[#4A5568]">{description}</p>
    </Modal>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: "green" | "dark" | "neutral";
}

const statColors = {
  green:   { wrap: "bg-[#64C832] border-transparent shadow-md", icon: "bg-white/20 text-white", label: "text-white/80", value: "text-white" },
  dark:    { wrap: "bg-[#146E37] border-transparent shadow-md", icon: "bg-white/20 text-white", label: "text-white/80", value: "text-white" },
  neutral: { wrap: "bg-white border-[#E5EDE0]",                 icon: "bg-[#E8F8DC] text-[#64C832]", label: "text-[#9CA3AF]", value: "text-[#1A1F16]" },
};

export function StatCard({ label, value, icon, trend, color = "neutral" }: StatCardProps) {
  const c = statColors[color];
  return (
    <div className={cn("rounded-2xl p-6 border", c.wrap)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", c.icon)}>
          {icon}
        </div>
        {trend && (
          <span className={cn("text-xs font-semibold", color === "neutral" ? "text-[#64C832]" : "text-white/80")}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className={cn("text-sm font-semibold mb-1", c.label)}>{label}</p>
        <p
          className={cn("text-3xl font-bold", c.value)}
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-[#1A1F16]">{label}</label>}
      <textarea
        className={cn(
          "w-full rounded-xl border border-[#E5EDE0] bg-white px-4 py-2.5 text-sm text-[#1A1F16] placeholder:text-[#9CA3AF]",
          "focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all duration-200 resize-none",
          error && "border-red-400",
          className
        )}
        rows={4}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}