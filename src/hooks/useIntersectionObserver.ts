import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

/**
 * Custom hook để detect khi element visible trong viewport
 * 
 * Hữu ích cho lazy loading images, infinite scroll, animations on scroll
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0px",
    freezeOnceVisible = false,
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Nếu đã visible và freeze enabled, không cần observe nữa
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        // Unobserve nếu visible và freeze enabled
        if (visible && freezeOnceVisible) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, isVisible]);

  return [elementRef, isVisible];
}

/**
 * Hook cho lazy loading images
 */
export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src);
    }
  }, [isVisible, src, imageSrc]);

  return { ref, src: imageSrc };
}

/**
 * Hook cho infinite scroll
 */
export function useInfiniteScroll(
  callback: () => void,
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: options.threshold || 1.0,
    rootMargin: options.rootMargin || "100px",
  });

  useEffect(() => {
    if (isVisible) {
      callback();
    }
  }, [isVisible, callback]);

  return ref;
}
