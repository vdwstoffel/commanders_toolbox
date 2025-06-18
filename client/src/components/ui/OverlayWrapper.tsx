import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  hideFn?: () => void;
}

export default function OverlayWrapper({ children, hideFn }: Props) {
  return (
    <div onClick={hideFn} className="fixed left-0 top-0 z-10 h-screen w-screen backdrop-blur-sm">
      <div className="fixed left-1/2 top-1/2 -translate-x-2/4 -translate-y-1/2">{children}</div>
    </div>
  );
}
