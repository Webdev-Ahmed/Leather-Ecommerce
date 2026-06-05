import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/api";

type StatusBadgeProps = {
  status: OrderStatus;
};

const STATUS_MAP: Record<
  OrderStatus,
  {
    label: string;
    variant: "default" | "success" | "danger" | "warning" | "muted";
  }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  PROCESSING: { label: "Processing", variant: "default" },
  SHIPPED: { label: "Shipped", variant: "muted" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, variant } = STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
