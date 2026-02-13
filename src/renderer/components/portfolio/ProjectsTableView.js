import { jsx as _jsx } from "react/jsx-runtime";
import { Table, Tag, Progress, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
export function ProjectsTableView({ projects, loading, onProjectClick }) {
    const getStatusColor = (status) => {
        const colors = {
            not_started: 'default',
            in_progress: 'blue',
            completed: 'green',
            on_hold: 'orange',
            cancelled: 'red',
        };
        return colors[status] || 'default';
    };
    const getStatusText = (status) => {
        const text = {
            not_started: 'Not Started',
            in_progress: 'In Progress',
            completed: 'Completed',
            on_hold: 'On Hold',
            cancelled: 'Cancelled',
        };
        return text[status] || status;
    };
    const columns = [
        {
            title: 'Project Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status) => (_jsx(Tag, { color: getStatusColor(status), children: getStatusText(status) })),
            sorter: (a, b) => a.status.localeCompare(b.status),
            filters: [
                { text: 'Not Started', value: 'not_started' },
                { text: 'In Progress', value: 'in_progress' },
                { text: 'Completed', value: 'completed' },
                { text: 'On Hold', value: 'on_hold' },
                { text: 'Cancelled', value: 'cancelled' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            key: 'owner',
            width: 150,
            sorter: (a, b) => (a.owner || '').localeCompare(b.owner || ''),
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            key: 'progress',
            width: 150,
            render: (progress) => (_jsx(Progress, { percent: progress || 0, size: "small" })),
            sorter: (a, b) => (a.progress || 0) - (b.progress || 0),
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120,
            render: (date) => date ? new Date(date).toLocaleDateString() : '-',
            sorter: (a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime(),
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            width: 120,
            render: (date) => date ? new Date(date).toLocaleDateString() : '-',
            sorter: (a, b) => new Date(a.end_date || 0).getTime() - new Date(b.end_date || 0).getTime(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_, record) => (_jsx(Button, { type: "link", icon: _jsx(EyeOutlined, {}), onClick: () => onProjectClick?.(record), children: "View" })),
        },
    ];
    return (_jsx(Table, { columns: columns, dataSource: projects, rowKey: "id", loading: loading, pagination: {
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} projects`,
        }, scroll: { x: 1000 } }));
}
