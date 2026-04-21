import { useState } from 'react';
import { 
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Upload,
  X,
  Tag,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface InboxItem {
  id: string;
  type: 'text' | 'link' | 'file' | 'screenshot';
  content: string;
  title?: string;
  timestamp: string;
  status: 'pending' | 'processed';
  suggestedProject?: string;
  suggestedPriority?: 'low' | 'medium' | 'high';
  suggestedType?: 'task' | 'issue' | 'risk';
}

const mockInboxItems: InboxItem[] = [
  {
    id: 'inbox-001',
    type: 'file',
    content: 'ERP_Migration_Updated_Schedule.xlsx',
    title: 'Updated project schedule from vendor',
    timestamp: '2 hours ago',
    status: 'pending',
    suggestedProject: 'ERP Migration',
    suggestedPriority: 'high',
    suggestedType: 'task'
  },
  {
    id: 'inbox-002',
    type: 'text',
    content: 'Security audit identified vulnerabilities in the authentication module. Needs immediate review before production deployment.',
    timestamp: '3 hours ago',
    status: 'pending',
    suggestedProject: 'Security Compliance Initiative',
    suggestedPriority: 'high',
    suggestedType: 'risk'
  },
  {
    id: 'inbox-003',
    type: 'link',
    content: 'https://vendor.com/cloud-pricing-changes',
    title: 'Cloud vendor announcing 15% price increase starting Q2',
    timestamp: '5 hours ago',
    status: 'pending',
    suggestedProject: 'Cloud Infrastructure Upgrade',
    suggestedPriority: 'medium',
    suggestedType: 'risk'
  },
  {
    id: 'inbox-004',
    type: 'screenshot',
    content: 'error-message-screenshot.png',
    title: 'Production error during mobile app testing',
    timestamp: '6 hours ago',
    status: 'pending',
    suggestedProject: 'Mobile App Development',
    suggestedPriority: 'high',
    suggestedType: 'issue'
  },
  {
    id: 'inbox-005',
    type: 'file',
    content: 'Meeting_Notes_2026-01-29.docx',
    title: 'Weekly stakeholder meeting notes',
    timestamp: '1 day ago',
    status: 'pending',
    suggestedProject: 'Data Warehouse Modernization',
    suggestedPriority: 'low',
    suggestedType: 'task'
  },
  {
    id: 'inbox-006',
    type: 'text',
    content: 'Database migration completed successfully. All validation tests passed.',
    timestamp: '1 day ago',
    status: 'processed',
    suggestedProject: 'ERP Migration',
    suggestedPriority: 'medium',
    suggestedType: 'task'
  }
];

export function InboxView() {
  const [items, setItems] = useState<InboxItem[]>(mockInboxItems);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);

  const pendingCount = items.filter(i => i.status === 'pending').length;

  const getTypeIcon = (type: InboxItem['type']) => {
    switch (type) {
      case 'text':
        return <FileText className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      case 'file':
        return <Upload className="w-5 h-5" />;
      case 'screenshot':
        return <ImageIcon className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleConfirm = (itemId: string) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, status: 'processed' as const } : item
    ));
    setSelectedItem(null);
  };

  const handleDiscard = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    setSelectedItem(null);
  };

  return (
    <div className="h-full flex bg-slate-50">
      {/* Left Panel - Inbox List */}
      <div className="w-2/5 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
              <p className="text-slate-500 mt-1">{pendingCount} items pending review</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Add File</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Add Note</span>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                AI suggestions {aiEnabled ? 'enabled' : 'disabled'}
              </p>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                aiEnabled 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {aiEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 rounded-lg mb-2 cursor-pointer transition-all ${
                  selectedItem?.id === item.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : item.status === 'processed'
                    ? 'bg-slate-50 border border-slate-200 opacity-60'
                    : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    item.status === 'processed' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.title && (
                      <h3 className="font-medium text-slate-900 mb-1 truncate">
                        {item.title}
                      </h3>
                    )}
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{item.timestamp}</span>
                      {item.status === 'processed' && (
                        <>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-xs font-medium">Processed</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Item Detail & Processing */}
      <div className="flex-1 flex flex-col">
        {selectedItem ? (
          <>
            <div className="p-6 border-b border-slate-200 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    {getTypeIcon(selectedItem.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedItem.title || 'Untitled Item'}
                    </h2>
                    <p className="text-slate-500 mt-1">{selectedItem.timestamp}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Content
                </label>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-slate-700">{selectedItem.content}</p>
                </div>
              </div>

              {/* AI Suggestions */}
              {aiEnabled && selectedItem.status === 'pending' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium text-blue-900">AI Suggestions</h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Based on the content, we've automatically filled in some fields below. Review and adjust as needed.
                  </p>
                </div>
              )}

              {/* Field Mapping */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project
                  </label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option>Select project...</option>
                    <option selected={selectedItem.suggestedProject === 'ERP Migration'}>
                      ERP Migration
                    </option>
                    <option selected={selectedItem.suggestedProject === 'Cloud Infrastructure Upgrade'}>
                      Cloud Infrastructure Upgrade
                    </option>
                    <option selected={selectedItem.suggestedProject === 'Mobile App Development'}>
                      Mobile App Development
                    </option>
                    <option selected={selectedItem.suggestedProject === 'Security Compliance Initiative'}>
                      Security Compliance Initiative
                    </option>
                    <option selected={selectedItem.suggestedProject === 'Data Warehouse Modernization'}>
                      Data Warehouse Modernization
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Item Type
                  </label>
                  <div className="flex gap-2">
                    <button className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedItem.suggestedType === 'task'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      Task
                    </button>
                    <button className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedItem.suggestedType === 'issue'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      Issue
                    </button>
                    <button className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedItem.suggestedType === 'risk'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      Risk
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    <button className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedItem.suggestedPriority === 'low'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      Low
                    </button>
                    <button className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedItem.suggestedPriority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      Medium
                    </button>
                    <button className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedItem.suggestedPriority === 'high'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      High
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Assign To
                  </label>
                  <input
                    type="text"
                    placeholder="Enter name or email..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Add tags (comma-separated)..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedItem.status === 'pending' && (
              <div className="p-6 border-t border-slate-200 bg-white">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDiscard(selectedItem.id)}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => handleConfirm(selectedItem.id)}
                    className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Confirm & Create
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                Select an item to review
              </h3>
              <p className="text-slate-500">
                Choose an item from the inbox to process and assign
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
