import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/users", label: "Users & Roles", icon: Users },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <aside className="w-60 shrink-0 h-screen bg-white border-r border-stone-200 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black tracking-tighter">H</span>
          </div>
          <div>
            <span className="text-sm font-bold text-stone-900 tracking-tight">HUB Admin</span>
            <p className="text-[10px] text-stone-400 leading-none mt-0.5">Management Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? "text-stone-300" : "text-stone-400 group-hover:text-stone-600"} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-stone-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Role badge */}
      {user?.role && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg">
            <ShieldCheck size={11} className="text-brand-500 shrink-0" />
            <span className="text-[10px] text-stone-500 font-medium capitalize">{user.role} access</span>
          </div>
        </div>
      )}

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-stone-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-brand-700">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-stone-800 truncate">{user?.name}</div>
            <div className="text-[10px] text-stone-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
