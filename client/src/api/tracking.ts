import api from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";

export type TrackingStep = {
  status: "pending" | "processing" | "shipped" | "delivered";
  label: string;
  completedAt: string | null;
  note: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
};

export type TrackingEvent = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
};

export type OrderTracking = {
  orderId: string;
  status: string;
  trackingNumber: string | null;
  isCancelled: boolean;
  steps: TrackingStep[];
  events: TrackingEvent[];
};

export async function getOrderTracking(
  orderId: string,
): Promise<OrderTracking> {
  const res = await api.get<ApiSuccess<OrderTracking>>(
    `/orders/${orderId}/tracking`,
  );
  return res.data.data;
}
