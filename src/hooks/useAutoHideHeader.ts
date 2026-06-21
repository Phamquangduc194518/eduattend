import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_HEADER_HEIGHT = 72;

export function useAutoHideHeader(enabled = true) {
  const [visible, setVisible] = useState(true);
  const [height, setHeight] = useState(DEFAULT_HEADER_HEIGHT);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (!enabled) return;

    const element = headerRef.current;
    if (!element) return;

    const updateHeight = () => {
      const nextHeight = element.offsetHeight;
      if (nextHeight > 0) setHeight(nextHeight);
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [enabled]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY < 12) {
          setVisible(true);
        } else if (delta > 18 && currentY > 64 && visibleRef.current) {
          setVisible(false);
        } else if (delta < -18 && !visibleRef.current) {
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const reset = useCallback(() => {
    setVisible(true);
    lastScrollY.current = 0;
    window.scrollTo({ top: 0 });
  }, []);

  return { visible, height: height || DEFAULT_HEADER_HEIGHT, headerRef, reset };
}
