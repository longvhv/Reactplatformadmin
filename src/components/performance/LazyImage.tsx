/**
 * LazyImage Component
 * Optimized lazy-loading image with blur-up effect
 */

import { useState } from 'react';
import { useImageLazyLoad } from '../../hooks/useImageLazyLoad';
import { cn } from '../ui/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  blurDataURL?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export function LazyImage({
  src,
  alt,
  blurDataURL,
  aspectRatio = '16/9',
  objectFit = 'cover',
  className,
  ...props
}: LazyImageProps) {
  const { imgRef, imageSrc, isLoaded, dataSrc } = useImageLazyLoad(src, {
    placeholder: blurDataURL,
  });

  return (
    <div
      className={cn('relative overflow-hidden bg-muted', className)}
      style={{ aspectRatio }}
    >
      <img
        ref={imgRef}
        data-src={dataSrc}
        src={imageSrc}
        alt={alt}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill'
        )}
        loading="lazy"
        {...props}
      />
      {!isLoaded && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
      )}
    </div>
  );
}
