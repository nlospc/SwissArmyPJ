import React, { useState, useEffect } from 'react';
import { ipc } from '@/lib/ipc';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import type { SearchResult } from '@/shared/types';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        const response = await ipc.search.global(query);
        if (response.success && response.data) {
          setResults(response.data);
        }
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'portfolio': return 'Portfolios';
      case 'project': return 'Projects';
      case 'work_item': return 'Work Items';
      case 'inbox': return 'Inbox';
      default: return type;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      portfolio: 'bg-purple-100 text-purple-800',
      project: 'bg-blue-100 text-blue-800',
      work_item: 'bg-green-100 text-green-800',
      inbox: 'bg-yellow-100 text-yellow-800',
    };
    return <Badge className={colors[type] || ''}>{type}</Badge>;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">Search across all portfolios, projects, work items, and inbox</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 text-lg h-12"
        />
      </div>

      {isSearching && (
        <p className="text-center text-muted-foreground">Searching...</p>
      )}

      {query.trim().length >= 2 && !isSearching && results.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No results found</p>
      )}

      {Object.keys(groupedResults).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type}>
              <h2 className="text-lg font-semibold mb-3">{getTypeLabel(type)}</h2>
              <div className="space-y-2">
                {items.map((result) => (
                  <Card key={`${result.type}-${result.id}`} className="hover:bg-accent cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getTypeBadge(result.type)}
                        <div className="flex-1">
                          <h3 className="font-medium">{result.title}</h3>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">{result.subtitle}</p>
                          )}
                          {result.metadata && result.metadata.status && (
                            <Badge variant="outline" className="mt-2">
                              {result.metadata.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {query.trim().length < 2 && (
        <div className="text-center text-muted-foreground py-12">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Enter at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
}
