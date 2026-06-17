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
  pending: { label: "Pending", variant: "warning" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "muted" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, variant } = STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
