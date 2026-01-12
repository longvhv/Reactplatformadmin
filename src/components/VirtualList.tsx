import { ReactNode } from "react";
import { useVirtualScroll } from "../hooks/useVirtualScroll";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscan?: number;
}

/**
 * Virtual List Component
 * 
 * Renders large lists efficiently by only rendering visible items
 * 
 * @example
 * <VirtualList
 *   items={data}
 *   itemHeight={50}
 *   renderItem={(item) => <div>{item.name}</div>}
 * />
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className = "",
  overscan = 3,
}: VirtualListProps<T>) {
  const { virtualItems, totalHeight, containerRef } = useVirtualScroll({
    itemHeight,
    totalItems: items.length,
    overscan,
  });

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: "100%", position: "relative" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {virtualItems.map(({ index, offsetTop }) => {
          const item = items[index];
          if (!item) return null;

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: itemHeight,
                transform: `translateY(${offsetTop}px)`,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Virtual Grid Component
 * 
 * Renders large grids efficiently
 */
interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  columns: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  gap?: number;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  columns,
  renderItem,
  className = "",
  gap = 16,
}: VirtualGridProps<T>) {
  const rowHeight = itemHeight + gap;
  const rows = Math.ceil(items.length / columns);

  const { virtualItems, totalHeight, containerRef } = useVirtualScroll({
    itemHeight: rowHeight,
    totalItems: rows,
    overscan: 2,
  });

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: "100%", position: "relative" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {virtualItems.map(({ index: rowIndex, offsetTop }) => {
          const startIndex = rowIndex * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={rowIndex}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${offsetTop}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={startIndex + colIndex} style={{ height: itemHeight }}>
                  {renderItem(item, startIndex + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
