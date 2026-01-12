import { useState, useEffect, useRef, useMemo } from "react";
import { getVisibleRange } from "../utils/performance";

interface VirtualScrollOptions {
  itemHeight: number;
  overscan?: number;
  totalItems: number;
}

interface VirtualScrollResult {
  virtualItems: Array<{ index: number; offsetTop: number }>;
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Custom hook cho virtual scrolling
 * Chỉ render items visible trong viewport để tối ưu hiệu năng
 * 
 * @param options - Cấu hình virtual scroll
 * @returns Virtual scroll utilities
 */
export function useVirtualScroll({
  itemHeight,
  overscan = 3,
  totalItems,
}: VirtualScrollOptions): VirtualScrollResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const { start, end } = useMemo(
    () => getVisibleRange(scrollTop, containerHeight, itemHeight, totalItems, overscan),
    [scrollTop, containerHeight, itemHeight, totalItems, overscan]
  );

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const items = [];
    for (let i = start; i < end; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
      });
    }
    return items;
  }, [start, end, itemHeight]);

  const totalHeight = totalItems * itemHeight;

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    // Use passive listener for better performance
    container.addEventListener("scroll", handleScroll, { passive: true });

    // Set initial container height
    setContainerHeight(container.clientHeight);

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  return {
    virtualItems,
    totalHeight,
    containerRef,
  };
}
