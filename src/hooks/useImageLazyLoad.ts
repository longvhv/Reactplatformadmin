/**
 * useImageLazyLoad Hook
 * Lazy load images with Intersection Observer
 */

import { useEffect, useRef, useState } from 'react';

interface UseImageLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
}

export function useImageLazyLoad(
  src: string,
  options: UseImageLazyLoadOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
  } = options;

  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const actualSrc = img.dataset.src;

            if (actualSrc) {
              // Preload image
              const tempImg = new Image();
              tempImg.onload = () => {
                setImageSrc(actualSrc);
                setIsLoaded(true);
              };
              tempImg.src = actualSrc;
            }

            observer.unobserve(img);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, threshold, rootMargin]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    dataSrc: src,
  };
}
