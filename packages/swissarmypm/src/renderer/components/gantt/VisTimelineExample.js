import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * VisTimelineExample - Example usage of VisTimelineWrapper
 *
 * This component demonstrates how to use the VisTimelineWrapper
 * with Project or WorkItem data.
 */
import { useState, useMemo } from 'react';
import { Card, Button, Space, message } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { VisTimelineWrapper } from './VisTimelineWrapper';
export const VisTimelineExample = () => {
    const [zoomLevel, setZoomLevel] = useState(1);
    // Sample data
    const items = useMemo(() => [
        {
            id: 1,
            content: 'Design Phase',
            start: new Date(2026, 1, 1),
            end: new Date(2026, 1, 15),
            type: 'range',
            className: 'timeline-phase status-done',
            title: 'Design Phase\nStatus: Done',
        },
        {
            id: 2,
            content: 'Development Sprint 1',
            start: new Date(2026, 1, 10),
            end: new Date(2026, 1, 24),
            type: 'range',
            className: 'timeline-task status-in_progress',
            title: 'Development Sprint 1\nStatus: In Progress',
        },
        {
            id: 3,
            content: 'Testing',
            start: new Date(2026, 1, 20),
            end: new Date(2026, 2, 5),
            type: 'range',
            className: 'timeline-task status-not_started',
            title: 'Testing\nStatus: Not Started',
        },
        {
            id: 4,
            content: 'Launch Milestone',
            start: new Date(2026, 2, 5),
            type: 'point',
            className: 'timeline-milestone',
            title: 'Launch Milestone\nStatus: Not Started',
        },
        {
            id: 5,
            content: 'Blocked Issue',
            start: new Date(2026, 1, 18),
            end: new Date(2026, 1, 22),
            type: 'range',
            className: 'timeline-issue status-blocked',
            title: 'Blocked Issue\nNeeds attention',
        },
    ], []);
    const options = useMemo(() => ({
        editable: {
            updateTime: true,
            updateGroup: false,
            add: false,
            remove: false,
        },
        stack: true,
        orientation: 'top',
        zoomMin: 86400000, // 1 day
        zoomMax: 31536000000, // 1 year
        start: new Date(2026, 0, 15),
        end: new Date(2026, 2, 15),
        margin: {
            item: 10,
            axis: 5,
        },
    }), []);
    const handleItemClick = (item) => {
        message.info(`Clicked: ${item.content}`);
        console.log('Item clicked:', item);
    };
    const handleItemDoubleClick = (item) => {
        message.success(`Double-clicked: ${item.content}`);
        console.log('Item double-clicked:', item);
    };
    const handleItemUpdate = (item, callback) => {
        console.log('Item updated:', item);
        message.success(`Updated: ${item.content}`);
        // Accept the change
        callback(item);
    };
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev * 1.2, 3));
    };
    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
    };
    return (_jsxs(Card, { title: "vis-timeline Example", extra: _jsxs(Space, { children: [_jsx(Button, { icon: _jsx(ZoomOutOutlined, {}), onClick: handleZoomOut, disabled: zoomLevel <= 0.5, children: "Zoom Out" }), _jsx(Button, { icon: _jsx(ZoomInOutlined, {}), onClick: handleZoomIn, disabled: zoomLevel >= 3, children: "Zoom In" })] }), children: [_jsx("div", { style: { height: 400 }, children: _jsx(VisTimelineWrapper, { items: items, options: options, onItemClick: handleItemClick, onItemDoubleClick: handleItemDoubleClick, onItemUpdate: handleItemUpdate }) }), _jsxs("div", { style: { marginTop: 16, fontSize: 12, color: '#666' }, children: [_jsx("p", { children: _jsx("strong", { children: "Try:" }) }), _jsxs("ul", { children: [_jsx("li", { children: "Click items to see messages" }), _jsx("li", { children: "Drag items to change dates" }), _jsx("li", { children: "Scroll to pan horizontally" }), _jsx("li", { children: "Ctrl+Scroll to zoom in/out" })] })] })] }));
};
