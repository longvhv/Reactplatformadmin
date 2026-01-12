import { useState, useEffect } from "react";
import { useLazyImage } from "../hooks/useIntersectionObserver";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
}

/**
 * Lazy Loading Image Component
 * 
 * Chỉ load image khi nó visible trong viewport
 * Có blur placeholder effect
 */
export function LazyImage({
  src,
  alt,
  placeholderSrc,
  className = "",
  ...props
}: LazyImageProps) {
  const { ref, src: lazySrc } = useLazyImage(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset loaded state khi src thay đổi
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}

      {/* Actual Image */}
      {lazySrc && !hasError && (
        <img
          src={lazySrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          loading="lazy"
          {...props}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Không thể tải ảnh</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Lazy Background Image Component
 */
export function LazyBackgroundImage({
  src,
  children,
  className = "",
}: {
  src: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { ref, src: lazySrc } = useLazyImage(src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (lazySrc) {
      const img = new Image();
      img.src = lazySrc;
      img.onload = () => setIsLoaded(true);
    }
  }, [lazySrc]);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        backgroundImage: isLoaded ? `url(${lazySrc})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}
      {children}
    </div>
  );
}
