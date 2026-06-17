import { type ReactNode, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}
export function Modal({ title, onClose, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full ${sizeClass} bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-stone-200`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeVariants: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  processing: "bg-blue-50 text-blue-700 border border-blue-200",
  shipped: "bg-violet-50 text-violet-700 border border-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  unpaid: "bg-red-50 text-red-700 border border-red-200",
  refunded: "bg-stone-100 text-stone-600 border border-stone-200",
  owner: "bg-stone-900 text-white border border-stone-900",
  admin: "bg-brand-600 text-white border border-brand-700",
  manager: "bg-stone-700 text-white border border-stone-700",
  customer: "bg-stone-100 text-stone-600 border border-stone-200",
  men: "bg-sky-50 text-sky-700 border border-sky-200",
  women: "bg-pink-50 text-pink-700 border border-pink-200",
  unisex: "bg-stone-100 text-stone-600 border border-stone-200",
  cod: "bg-stone-100 text-stone-600 border border-stone-200",
  payfast: "bg-brand-50 text-brand-700 border border-brand-200",
  default: "bg-stone-100 text-stone-600 border border-stone-200",
};

export function Badge({ value }: { value: string }) {
  const cls = badgeVariants[value] ?? badgeVariants.default;
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full capitalize tracking-wide ${cls}`}>
      {value}
    </span>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmLabel?: string;
  danger?: boolean;
}
export function ConfirmDialog({ message, onConfirm, onCancel, loading, confirmLabel = "Delete", danger = true }: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-stone-200">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
          {danger ? <Trash2 size={18} className="text-red-600" /> : <AlertTriangle size={18} className="text-amber-600" />}
        </div>
        <p className="text-sm text-stone-700 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-60 ${
              danger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-stone-900 text-white hover:bg-stone-700"
            }`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-stone-400">
      {icon && <div className="mb-3 opacity-40">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}
export function Field({ label, children, required, hint }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

// ─── Input class ──────────────────────────────────────────────────────────────
export const inputCls =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-white transition-shadow placeholder:text-stone-400";

export const selectCls =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-white transition-shadow cursor-pointer";

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" }[size];
  return (
    <div className="flex items-center justify-center py-16">
      <div className={`${s} border-2 border-stone-200 border-t-brand-500 rounded-full animate-spin`} />
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  icon?: ReactNode;
}
export function StatCard({ label, value, sub, accent, icon }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? "bg-brand-600 border-brand-700 text-white" : "bg-white border-stone-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-brand-100" : "text-stone-500"}`}>
          {label}
        </span>
        {icon && (
          <span className={`${accent ? "text-brand-200" : "text-stone-300"}`}>
            {icon}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-stone-900"}`}>{value}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? "text-brand-200" : "text-stone-400"}`}>{sub}</div>}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}
export function Pagination({ page, totalPages, total, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-3 mt-5 text-sm text-stone-600">
      <span className="text-xs text-stone-400">
        {total} result{total !== 1 ? "s" : ""}
      </span>
      <div className="flex gap-1 ml-auto items-center">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-300 disabled:opacity-30 hover:bg-stone-50 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="px-3 py-1 text-xs font-medium text-stone-600">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-300 disabled:opacity-30 hover:bg-stone-50 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}
export function Btn({ variant = "primary", size = "md", loading, children, className = "", ...props }: BtnProps) {
  const variantCls = {
    primary: "bg-stone-900 text-white hover:bg-stone-700 border border-stone-900",
    secondary: "bg-white text-stone-700 hover:bg-stone-50 border border-stone-300",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-red-600",
    ghost: "bg-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-transparent",
  }[variant];

  const sizeCls = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  }[size];

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer ${variantCls} ${sizeCls} ${className}`}
    >
      {loading && (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
      )}
      {children}
    </button>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide border-b border-stone-100 bg-stone-50 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-stone-700 border-b border-stone-50 ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors last:border-b-0 ${onClick ? "cursor-pointer hover:bg-stone-50/80" : "hover:bg-stone-50/40"}`}
    >
      {children}
    </tr>
  );
}
