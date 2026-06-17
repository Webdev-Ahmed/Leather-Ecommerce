import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Order, OrderStatus } from "../types";
import {
  PageHeader,
  Modal,
  Field,
  inputCls,
  selectCls,
  EmptyState,
  Spinner,
  Badge,
  Pagination,
  Table,
  Th,
  Td,
  Tr,
  Btn,
} from "../components/ui";
import { ShoppingCart, MapPin, Package, Clock, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const ORDER_STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [note, setNote] = useState("");

  const isTerminal = order.status === "delivered" || order.status === "cancelled";

  const updateMutation = useMutation({
    mutationFn: (payload: { status: OrderStatus; trackingNumber?: string; note?: string }) =>
      api.patch(`/orders/${order.id}/status`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated");
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed"),
  });

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: { status: OrderStatus; trackingNumber?: string; note?: string } = {
      status: newStatus,
    };
    if (trackingNumber) payload.trackingNumber = trackingNumber;
    if (note) payload.note = note;
    updateMutation.mutate(payload);
  };

  const addr = order.shippingAddress;

  return (
    <Modal title={`Order — ${order.merchantRef ?? order.id.slice(0, 8).toUpperCase()}`} onClose={onClose} size="xl">
      <div className="space-y-5">
        {/* Overview grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Status", content: <Badge value={order.status} /> },
            { label: "Payment", content: <Badge value={order.paymentStatus} /> },
            { label: "Method", content: <span className="text-xs font-bold uppercase text-stone-700">{order.paymentMethod}</span> },
            {
              label: "Total",
              content: <span className="text-lg font-bold text-stone-900">PKR {order.totalAmount.toLocaleString()}</span>,
            },
          ].map(({ label, content }) => (
            <div key={label} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="text-xs text-stone-400 font-medium mb-1.5">{label}</div>
              {content}
            </div>
          ))}
        </div>

        {order.trackingNumber && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Package size={14} className="text-blue-600 shrink-0" />
            <div>
              <span className="text-xs text-blue-600 font-medium">Tracking Number</span>
              <div className="font-mono text-sm font-semibold text-blue-800">{order.trackingNumber}</div>
            </div>
          </div>
        )}

        {/* Shipping address */}
        {addr && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
              <MapPin size={11} /> Shipping Address
            </div>
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 text-sm text-stone-700 leading-relaxed">
              {addr.label && <div className="font-semibold text-stone-800 mb-1">{addr.label}</div>}
              <div>{addr.street}</div>
              <div>
                {addr.city}
                {addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
              </div>
              <div className="text-stone-500">{addr.country}</div>
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
            Order Items ({order.items.length})
          </div>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border border-stone-100 rounded-xl p-3 bg-stone-50/50"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 object-cover rounded-lg border border-stone-200 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-800 truncate">{item.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                    {item.sku && <span className="ml-1 font-mono">#{item.sku}</span>}
                  </div>
                </div>
                <div className="text-sm text-right shrink-0">
                  <div className="font-semibold text-stone-800">
                    PKR {item.price.toLocaleString()} × {item.quantity}
                  </div>
                  <div className="text-xs text-stone-400">
                    = PKR {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event timeline */}
        {order.events.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
              <Clock size={11} /> Event Timeline
            </div>
            <div className="space-y-2">
              {order.events.map((evt, i) => (
                <div key={evt.id} className="flex items-center gap-3 text-sm">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                    {i < order.events.length - 1 && (
                      <div className="absolute left-0.5 top-2 w-px h-6 bg-stone-200" />
                    )}
                  </div>
                  <Badge value={evt.status} />
                  <span className="text-stone-500 flex-1">{evt.note ?? ""}</span>
                  <span className="text-xs text-stone-400 shrink-0">
                    {new Date(evt.createdAt).toLocaleString("en-PK")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Update status */}
        {!isTerminal ? (
          <div className="border-t border-stone-100 pt-5">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Update Order Status</div>
            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="New Status">
                  <select
                    className={selectCls}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tracking Number">
                  <input
                    className={inputCls}
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
              <Field label="Note">
                <input
                  className={inputCls}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional internal note"
                />
              </Field>
              <div className="flex justify-end">
                <Btn type="submit" loading={updateMutation.isPending}>
                  Update Status
                </Btn>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-sm text-stone-400 border-t border-stone-100 pt-4">
            This order is <Badge value={order.status} /> and cannot be updated further.
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, statusFilter, paymentFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      return api.get(`/orders?${params}`).then((r) => r.data);
    },
  });

  const orders: Order[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={meta ? `${meta.total} total order${meta.total !== 1 ? "s" : ""}` : ""}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          className={`${selectCls} w-48`}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select
          className={`${selectCls} w-48`}
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders found." icon={<ShoppingCart size={32} />} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Order Ref</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th>Method</Th>
                <Th>Date</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Tr key={o.id} onClick={() => setSelectedOrder(o)}>
                  <Td>
                    <code className="font-mono text-xs text-stone-500">
                      {o.merchantRef ?? o.id.slice(0, 8).toUpperCase()}
                    </code>
                  </Td>
                  <Td>
                    <span className="text-stone-500 text-xs">
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-semibold text-stone-800">
                      PKR {o.totalAmount.toLocaleString()}
                    </span>
                  </Td>
                  <Td>
                    <Badge value={o.status} />
                  </Td>
                  <Td>
                    <Badge value={o.paymentStatus} />
                  </Td>
                  <Td>
                    <Badge value={o.paymentMethod} />
                  </Td>
                  <Td>
                    <span className="text-xs text-stone-400">
                      {new Date(o.createdAt).toLocaleDateString("en-PK")}
                    </span>
                  </Td>
                  <Td>
                    <ChevronRight size={14} className="text-stone-300" />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPage={setPage}
            />
          )}
        </>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
