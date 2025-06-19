import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  hideFn: () => void;
}

export default function OverlayWrapper({ children, hideFn }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        hideFn();
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick);
  }, [hideFn]);

  useEffect(() => {
    function escapeHandler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        hideFn();
      }
    }

    document.addEventListener("keydown", escapeHandler, true);
    return () => document.removeEventListener("keydown", escapeHandler);
  }, [hideFn]);

  return (
    <div  className="fixed left-0 top-0 z-10 h-screen w-screen backdrop-blur-sm">
      <div className="fixed left-1/2 top-1/2 -translate-x-2/4 -translate-y-1/2">
        <div ref={ref} className="max-h-screen overflow-auto rounded-lg bg-neutral-900/80 p-10 text-neutral-200 mt-20">
          {children}
        </div>
      </div>
    </div>
  );
}
