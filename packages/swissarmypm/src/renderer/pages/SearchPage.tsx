import React, { useState, useEffect } from 'react';
import { ipc } from '@/lib/ipc';
import { Input, Card, Badge, Empty, Typography, Tabs, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { SearchResult } from '@/shared/types';

const { Title, Text } = Typography;
const { Search } = Input;

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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
    const labels: Record<string, string> = {
      portfolio: 'Portfolios',
      project: 'Projects',
      work_item: 'Work Items',
      inbox: 'Inbox',
    };
    return labels[type] || type;
  };

  const getTypeTag = (type: string) => {
    const colors: Record<string, string> = {
      portfolio: 'purple',
      project: 'blue',
      work_item: 'green',
      inbox: 'orange',
    };
    return <Tag color={colors[type] || 'default'}>{type}</Tag>;
  };

  const tabItems = [
    {
      key: 'all',
      label: 'All',
      children: renderAllResults(groupedResults, getTypeTag),
    },
    ...Object.keys(groupedResults).map(type => ({
      key: type,
      label: `${getTypeLabel(type)} (${groupedResults[type].length})`,
      children: renderTypeResults(groupedResults[type], getTypeTag),
    })),
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Title level={2}>Search</Title>
        <Text type="secondary">Search across all portfolios, projects, work items, and inbox</Text>
      </div>

      <Search
        placeholder="Search..."
        size="large"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        prefix={<SearchOutlined />}
        allowClear
      />

      {isSearching && (
        <div className="text-center">
          <Text type="secondary">Searching...</Text>
        </div>
      )}

      {query.trim().length >= 2 && !isSearching && results.length === 0 && (
        <Empty description="No results found" />
      )}

      {results.length > 0 && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />
      )}

      {query.trim().length < 2 && (
        <Empty
          image={<SearchOutlined className="text-6xl text-gray-300" />}
          description="Enter at least 2 characters to search"
        />
      )}
    </div>
  );
}

function renderAllResults(
  groupedResults: Record<string, SearchResult[]>,
  getTypeTag: (type: string) => React.ReactNode
) {
  return (
    <div className="space-y-6">
      {Object.entries(groupedResults).map(([type, items]) => (
        <div key={type}>
          <Title level={4}>{getTypeLabel(type)}</Title>
          <div className="space-y-2">
            {items.map((result) => renderResultCard(result, getTypeTag))}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderTypeResults(
  items: SearchResult[],
  getTypeTag: (type: string) => React.ReactNode
) {
  return (
    <div className="space-y-2">
      {items.map((result) => renderResultCard(result, getTypeTag))}
    </div>
  );
}

function renderResultCard(
  result: SearchResult,
  getTypeTag: (type: string) => React.ReactNode
) {
  return (
    <Card
      key={`${result.type}-${result.id}`}
      size="small"
      hoverable
      className="cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {getTypeTag(result.type)}
        <div className="flex-1">
          <div className="font-medium">{result.title}</div>
          {result.subtitle && (
            <Text type="secondary" className="text-sm mt-1 block">
              {result.subtitle}
            </Text>
          )}
          {result.metadata && result.metadata.status && (
            <Badge className="mt-2">{result.metadata.status}</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    portfolio: 'Portfolios',
    project: 'Projects',
    work_item: 'Work Items',
    inbox: 'Inbox',
  };
  return labels[type] || type;
}
