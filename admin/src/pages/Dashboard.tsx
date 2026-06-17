import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { PageHeader, StatCard, Badge, Spinner, Table, Th, Td, Tr } from "../components/ui";
import type { Order, Product } from "../types";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Tags,
  Clock,
  AlertTriangle,
  Users,
  BarChart3,
} from "lucide-react";

function RevenueBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-stone-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-stone-100 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-stone-700 w-24 text-right shrink-0">
        PKR {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-summary"],
    queryFn: () => api.get("/orders?limit=100").then((r) => r.data),
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products-summary"],
    queryFn: () => api.get("/products?limit=100").then((r) => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-count"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-count"],
    queryFn: () => api.get("/users?limit=1").then((r) => r.data).catch(() => null),
  });

  if (loadingOrders || loadingProducts) return <Spinner />;

  const orders: Order[] = ordersData?.data ?? [];
  const products: Product[] = productsData?.data ?? [];
  const categories = categoriesData?.data ?? [];

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const processingOrders = orders.filter((o) => o.status === "processing").length;
  const lowStock = products.filter((p) => p.stock < 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // Revenue by status breakdown
  const revenueByStatus = {
    delivered: orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.totalAmount, 0),
    shipped: orders.filter((o) => o.status === "shipped").reduce((s, o) => s + o.totalAmount, 0),
    processing: orders.filter((o) => o.status === "processing").reduce((s, o) => s + o.totalAmount, 0),
  };
  const maxRev = Math.max(...Object.values(revenueByStatus));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview · ${new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      />

      {/* Primary stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Total Revenue"
          value={`PKR ${totalRevenue.toLocaleString()}`}
          sub="from paid orders"
          accent
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Total Orders"
          value={ordersData?.meta?.total ?? orders.length}
          sub="all time"
          icon={<ShoppingCart size={16} />}
        />
        <StatCard
          label="Products"
          value={productsData?.pagination?.total ?? products.length}
          sub={`${lowStock} low stock`}
          icon={<Package size={16} />}
        />
        <StatCard
          label="Categories"
          value={categories.length}
          sub="product categories"
          icon={<Tags size={16} />}
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Pending Orders"
          value={pendingOrders}
          sub="awaiting processing"
          icon={<Clock size={16} />}
        />
        <StatCard
          label="In Processing"
          value={processingOrders}
          sub="being prepared"
          icon={<BarChart3 size={16} />}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock}
          sub={`${outOfStock} out of stock`}
          icon={<AlertTriangle size={16} />}
        />
        <StatCard
          label="Total Users"
          value={usersData?.meta?.total ?? "—"}
          sub="registered accounts"
          icon={<Users size={16} />}
        />
      </div>

      {/* Revenue breakdown + recent orders */}
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue by fulfilment */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Revenue Breakdown</h2>
          <div className="space-y-3">
            <RevenueBar label="Delivered" value={revenueByStatus.delivered} max={maxRev} />
            <RevenueBar label="Shipped" value={revenueByStatus.shipped} max={maxRev} />
            <RevenueBar label="Processing" value={revenueByStatus.processing} max={maxRev} />
          </div>

          <hr className="border-stone-100 my-4" />
          <div className="space-y-2">
            {(["pending", "processing", "shipped", "delivered", "cancelled"] as const).map((status) => {
              const count = orders.filter((o) => o.status === status).length;
              const pct = orders.length > 0 ? ((count / orders.length) * 100).toFixed(0) : 0;
              return (
                <div key={status} className="flex items-center justify-between text-xs">
                  <Badge value={status} />
                  <span className="text-stone-500">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent orders */}
        <div className="col-span-2 bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Recent Orders</h2>
            <span className="text-xs text-stone-400">{recentOrders.length} shown</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-stone-400 text-sm">No orders yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">
                      {order.merchantRef ?? order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-800">
                      PKR {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400">
                      {new Date(order.createdAt).toLocaleDateString("en-PK")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock > 0 && (
        <div className="mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Stock Alert</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {lowStock} product{lowStock !== 1 ? "s" : ""} with fewer than 5 units remaining.
                  {outOfStock > 0 && ` ${outOfStock} product${outOfStock !== 1 ? "s" : ""} out of stock.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
