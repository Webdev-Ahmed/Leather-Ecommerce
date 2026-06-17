import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MainContent } from "@/components/layout/MainContent";
import { CartDrawer } from "@/components/cart/CartDrawer";
import type { ReactNode } from "react";

type StoreLayoutProps = {
  children: ReactNode;
};

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    // No overflow-x-hidden here — that would clip fixed children (nav, cart drawer).
    // Horizontal overflow is handled by overflow-x: clip on <body> in globals.css.
    <>
      <Navbar />
      <MainContent>{children}</MainContent>
      <Footer />
      <CartDrawer />
    </>
  );
}
