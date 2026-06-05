import { Navbar } from "@/components/layout/Navbar";
import type { ReactNode } from "react";

type StoreLayoutProps = {
  children: ReactNode;
};

// RSC layout — Navbar fetches categories server-side.
// CartDrawer will be added here in Step 4.
export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
