import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ipc } from '@/lib/ipc';
import { Input, Card, Badge, Empty, Typography, Tabs, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;
const { Search } = Input;
export function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
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
            }
            else {
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
    }, {});
    const getTypeLabel = (type) => {
        const labels = {
            portfolio: 'Portfolios',
            project: 'Projects',
            work_item: 'Work Items',
            inbox: 'Inbox',
        };
        return labels[type] || type;
    };
    const getTypeTag = (type) => {
        const colors = {
            portfolio: 'purple',
            project: 'blue',
            work_item: 'green',
            inbox: 'orange',
        };
        return _jsx(Tag, { color: colors[type] || 'default', children: type });
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
    return (_jsxs("div", { className: "p-8 max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { children: [_jsx(Title, { level: 2, children: "Search" }), _jsx(Text, { type: "secondary", children: "Search across all portfolios, projects, work items, and inbox" })] }), _jsx(Search, { placeholder: "Search...", size: "large", value: query, onChange: (e) => setQuery(e.target.value), prefix: _jsx(SearchOutlined, {}), allowClear: true }), isSearching && (_jsx("div", { className: "text-center", children: _jsx(Text, { type: "secondary", children: "Searching..." }) })), query.trim().length >= 2 && !isSearching && results.length === 0 && (_jsx(Empty, { description: "No results found" })), results.length > 0 && (_jsx(Tabs, { activeKey: activeTab, onChange: setActiveTab, items: tabItems, type: "card" })), query.trim().length < 2 && (_jsx(Empty, { image: _jsx(SearchOutlined, { className: "text-6xl text-gray-300" }), description: "Enter at least 2 characters to search" }))] }));
}
function renderAllResults(groupedResults, getTypeTag) {
    return (_jsx("div", { className: "space-y-6", children: Object.entries(groupedResults).map(([type, items]) => (_jsxs("div", { children: [_jsx(Title, { level: 4, children: getTypeLabel(type) }), _jsx("div", { className: "space-y-2", children: items.map((result) => renderResultCard(result, getTypeTag)) })] }, type))) }));
}
function renderTypeResults(items, getTypeTag) {
    return (_jsx("div", { className: "space-y-2", children: items.map((result) => renderResultCard(result, getTypeTag)) }));
}
function renderResultCard(result, getTypeTag) {
    return (_jsx(Card, { size: "small", hoverable: true, className: "cursor-pointer", children: _jsxs("div", { className: "flex items-start gap-3", children: [getTypeTag(result.type), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: result.title }), result.subtitle && (_jsx(Text, { type: "secondary", className: "text-sm mt-1 block", children: result.subtitle })), result.metadata && result.metadata.status && (_jsx(Badge, { className: "mt-2", children: result.metadata.status }))] })] }) }, `${result.type}-${result.id}`));
}
function getTypeLabel(type) {
    const labels = {
        portfolio: 'Portfolios',
        project: 'Projects',
        work_item: 'Work Items',
        inbox: 'Inbox',
    };
    return labels[type] || type;
}
