'use client';

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

export function NavigationTest() {
  const location = useLocation();
  const [navigationCount, setNavigationCount] = useState(0);
  const [lastNavTime, setLastNavTime] = useState<number | null>(null);
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    const start = performance.now();
    setNavigationCount((prev) => prev + 1);
    
    const timeout = setTimeout(() => {
      const end = performance.now();
      setLastNavTime(end - start);
      console.log(`🔄 Navigation to ${location.pathname} took ${(end - start).toFixed(2)}ms`);
    }, 0);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  if (!isClientSide) return null;

  const isWorking = lastNavTime !== null && lastNavTime < 200;

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🔍 Navigation Debug</span>
          {isWorking ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Working
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Check
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Path:</span>
          <code className="text-xs bg-muted px-2 py-1 rounded">{location.pathname}</code>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Navigations:</span>
          <Badge variant="outline">{navigationCount}</Badge>
        </div>
        {lastNavTime !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Nav Time:</span>
            <Badge variant={lastNavTime < 200 ? "default" : "destructive"}>
              {lastNavTime.toFixed(0)}ms
            </Badge>
          </div>
        )}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          {isWorking ? (
            <p className="text-green-600 dark:text-green-400">
              ✅ Client-side navigation is working! Navigation should be instant.
            </p>
          ) : (
            <p className="text-orange-600 dark:text-orange-400">
              ⚠️ If navigation feels slow (&gt;200ms), check NAVIGATION_DEBUG.md
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}