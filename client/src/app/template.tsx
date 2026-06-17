import type { ReactNode } from "react";

type AppTemplateProps = {
  children: ReactNode;
};

// CSS-only page enter animation — no JS/Framer overhead on every navigation.
// The element re-mounts on route change so the keyframe always re-fires.
export default function AppTemplate({ children }: AppTemplateProps) {
  return (
    <div className="animate-in fade-in duration-150 min-h-full">{children}</div>
  );
}
