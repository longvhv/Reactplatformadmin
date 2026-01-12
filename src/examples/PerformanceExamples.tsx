/**
 * Performance Optimization Examples
 * Real-world usage examples
 */

import { useState } from 'react';
import { LazyImage, VirtualList } from '../components/performance';
import { useInfiniteScroll, useOptimistic, useIsMobile } from '../hooks';
import { cacheManager, debounce } from '../lib';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

/**
 * Example 1: Lazy Loading Images
 */
export function LazyImageExample() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <LazyImage
          key={i}
          src={`https://picsum.photos/400/300?random=${i}`}
          alt={`Image ${i}`}
          aspectRatio="4/3"
          blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23ddd' filter='url(%23b)'/%3E%3C/svg%3E"
        />
      ))}
    </div>
  );
}

/**
 * Example 2: Virtual Scrolling
 */
export function VirtualScrollExample() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `Description for item ${i}`,
  }));

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Virtual List (10,000 items)</h3>
      <VirtualList
        items={items}
        itemHeight={60}
        containerHeight={600}
        renderItem={(item) => (
          <div className="p-4 border-b hover:bg-muted/50 transition-colors">
            <h4 className="font-medium">{item.name}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        )}
      />
    </Card>
  );
}

/**
 * Example 3: Infinite Scroll
 */
export function InfiniteScrollExample() {
  const [items, setItems] = useState(Array.from({ length: 20 }, (_, i) => i));
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newItems = Array.from(
      { length: 20 },
      (_, i) => items.length + i
    );
    
    setItems(prev => [...prev, ...newItems]);
    setIsLoading(false);
    
    if (items.length >= 100) {
      setHasMore(false);
    }
  };

  const { observerTarget } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: loadMore,
  });

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Infinite Scroll</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="p-4 bg-muted rounded-lg">
            Item {item}
          </div>
        ))}
        <div ref={observerTarget} className="py-4 text-center">
          {isLoading && 'Loading...'}
          {!hasMore && 'No more items'}
        </div>
      </div>
    </Card>
  );
}

/**
 * Example 4: Optimistic Updates
 */
export function OptimisticUpdateExample() {
  const { value: todos, updateOptimistic, isOptimistic } = useOptimistic<string[]>([]);
  const [input, setInput] = useState('');

  const addTodo = async () => {
    if (!input.trim()) return;

    await updateOptimistic(
      [...todos, input],
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        return [...todos, input];
      }
    );

    setInput('');
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">
        Optimistic Updates {isOptimistic && '(Saving...)'}
      </h3>
      <div className="flex gap-2 mb-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add todo..."
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <Button onClick={addTodo}>Add</Button>
      </div>
      <div className="space-y-2">
        {todos.map((todo, i) => (
          <div key={i} className="p-2 bg-muted rounded">
            {todo}
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Example 5: Debounced Search
 */
export function DebouncedSearchExample() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const search = debounce(async (q: string) => {
    if (!q) {
      setResults([]);
      return;
    }

    // Check cache first
    const cached = cacheManager.get<string[]>(`search:${q}`);
    if (cached) {
      setResults(cached);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockResults = [
      `${q} - Result 1`,
      `${q} - Result 2`,
      `${q} - Result 3`,
    ];

    // Cache results
    cacheManager.set(`search:${q}`, mockResults, 5 * 60 * 1000);
    setResults(mockResults);
  }, 300);

  const handleSearch = (value: string) => {
    setQuery(value);
    search(value);
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Debounced Search (with Cache)</h3>
      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Type to search..."
        className="mb-4"
      />
      <div className="space-y-2">
        {results.map((result, i) => (
          <div key={i} className="p-2 bg-muted rounded">
            {result}
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Example 6: Responsive Component
 */
export function ResponsiveExample() {
  const isMobile = useIsMobile();

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Responsive Detection</h3>
      <p className="text-muted-foreground">
        Current device: <strong>{isMobile ? 'Mobile' : 'Desktop'}</strong>
      </p>
      {isMobile ? (
        <div className="mt-4 p-4 bg-primary/10 rounded">
          📱 Mobile optimized view
        </div>
      ) : (
        <div className="mt-4 p-4 bg-primary/10 rounded">
          💻 Desktop full-featured view
        </div>
      )}
    </Card>
  );
}

/**
 * Example 7: All Examples Page
 */
export function PerformanceExamplesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Performance Examples</h1>
        <p className="text-muted-foreground">
          Real-world examples of performance optimizations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LazyImageExample />
        <VirtualScrollExample />
        <InfiniteScrollExample />
        <OptimisticUpdateExample />
        <DebouncedSearchExample />
        <ResponsiveExample />
      </div>
    </div>
  );
}
