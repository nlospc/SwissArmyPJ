import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * QuickTaskInput - Inline "+ Add Quick Task" input
 */
import { useState, useRef } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Button, Select } from 'antd';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
export function QuickTaskInput({ defaultProjectId, projects }) {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || 0);
    const inputRef = useRef(null);
    const addQuickTask = useMyWorkStore((state) => state.addQuickTask);
    const loading = useMyWorkStore((state) => state.loading);
    const handleStart = () => {
        setIsAdding(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };
    const handleCancel = () => {
        setIsAdding(false);
        setTitle('');
        setProjectId(defaultProjectId || projects[0]?.id || 0);
    };
    const handleSave = async () => {
        if (!title.trim() || !projectId)
            return;
        await addQuickTask(projectId, title.trim());
        setTitle('');
        setIsAdding(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        else if (e.key === 'Escape') {
            handleCancel();
        }
    };
    if (!isAdding) {
        return (_jsxs(Button, { type: "primary", className: "w-full", onClick: handleStart, children: [_jsx(Plus, { className: "h-4 w-4", style: { marginRight: 8 } }), "Add New Task"] }));
    }
    return (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 rounded-lg border border-blue-500 bg-blue-50", children: [!defaultProjectId && (_jsx(Select, { value: projectId, onChange: (value) => setProjectId(value), style: { width: 140 }, options: projects.map((p) => ({ value: p.id, label: p.name })) })), _jsx("input", { ref: inputRef, type: "text", value: title, onChange: (e) => setTitle(e.target.value), onKeyDown: handleKeyDown, placeholder: "Task title...", className: "flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400", disabled: loading }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { size: "small", type: "primary", onClick: handleSave, disabled: !title.trim() || loading, children: _jsx(Check, { className: "h-3 w-3" }) }), _jsx(Button, { size: "small", type: "text", onClick: handleCancel, disabled: loading, children: _jsx(X, { className: "h-3 w-3" }) })] })] }));
}
