"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>{children}</div>;
}
