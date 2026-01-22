import { useState, useEffect, useCallback, useMemo } from 'react';

// Custom event for navigation synchronization
const NAV_EVENT = 'shim-navigation';

function dispatchNav() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NAV_EVENT));
  }
}

// Mock implementation of ReadonlyURLSearchParams
class ReadonlyURLSearchParams extends URLSearchParams {
  append() { throw new Error('ReadonlyURLSearchParams is read-only'); }
  delete() { throw new Error('ReadonlyURLSearchParams is read-only'); }
  set() { throw new Error('ReadonlyURLSearchParams is read-only'); }
  sort() { throw new Error('ReadonlyURLSearchParams is read-only'); }
}

export function useRouter() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handleNav = () => setCurrentPath(window.location.pathname);
    window.addEventListener(NAV_EVENT, handleNav);
    window.addEventListener('popstate', handleNav);
    return () => {
      window.removeEventListener(NAV_EVENT, handleNav);
      window.removeEventListener('popstate', handleNav);
    };
  }, []);

  return useMemo(() => ({
    push: (href: string) => {
      window.history.pushState(null, '', href);
      dispatchNav();
    },
    replace: (href: string) => {
      window.history.replaceState(null, '', href);
      dispatchNav();
    },
    back: () => {
      window.history.back();
    },
    forward: () => {
      window.history.forward();
    },
    refresh: () => {
      window.location.reload();
    },
    // Legacy properties
    pathname: currentPath,
    query: typeof window !== 'undefined' 
      ? Object.fromEntries(new URLSearchParams(window.location.search)) 
      : {},
  }), [currentPath]);
}

export function usePathname() {
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  useEffect(() => {
    const handleNav = () => setPathname(window.location.pathname);
    window.addEventListener(NAV_EVENT, handleNav);
    window.addEventListener('popstate', handleNav);
    return () => {
      window.removeEventListener(NAV_EVENT, handleNav);
      window.removeEventListener('popstate', handleNav);
    };
  }, []);

  return pathname;
}

export function useSearchParams() {
  const [searchParams, setSearchParams] = useState(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  );

  useEffect(() => {
    const handleNav = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener(NAV_EVENT, handleNav);
    window.addEventListener('popstate', handleNav);
    return () => {
      window.removeEventListener(NAV_EVENT, handleNav);
      window.removeEventListener('popstate', handleNav);
    };
  }, []);

  return useMemo(() => {
    // Return a read-only wrapper or the object itself if we don't care about strict readonly
    return new ReadonlyURLSearchParams(searchParams);
  }, [searchParams]);
}

export function useParams() {
  // Without a router context (like Next.js or React Router), we can't easily extract params.
  // We can try to regex match the current path against known patterns if strictly needed,
  // but for now we return empty object to prevent crashes.
  return {}; 
}

export const redirect = (url: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
};

export const notFound = () => {
  console.error('Page not found');
};

export const Link = ({ href, to, children, ...props }: any) => {
  const target = href || to || '#';
  
  const handleClick = (e: any) => {
    if (props.onClick) props.onClick(e);
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      window.history.pushState(null, '', target);
      dispatchNav();
    }
  };

  return (
    <a href={target} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};
