import { useState, useEffect } from 'react';
import { 
  FileText, 
  Link as LinkIcon, 
  Upload, 
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { storage, InboxItem, Project, WorkItem, generateId } from '../lib/storage';

interface InboxPageProps {
  onInboxChange: () => void;
}

type FilterType = 'all' | 'unprocessed' | 'processed';
type EntityType = 'project' | 'workItem' | null;
type WorkItemType = 'task' | 'issue' | 'milestone' | 'remark' | 'clash' | 'phase';
type Status = 'not_started' | 'in_progress' | 'done' | 'blocked';

interface MappingState {
  entityType: EntityType;
  // Project fields
  projectName?: string;
  projectOwner?: string;
  projectStatus?: Status;
  projectStartDate?: string;
  projectEndDate?: string;
  projectTags?: string;
  projectPortfolio?: string;
  // WorkItem fields
  workItemProject?: string;
  workItemType?: WorkItemType;
  workItemTitle?: string;
  workItemStatus?: Status;
  workItemStartDate?: string;
  workItemEndDate?: string;
  workItemParent?: string;
  workItemNotes?: string;
}

export function InboxPage({ onInboxChange }: InboxPageProps) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Classify, 2: Extract, 3: Review
  const [mapping, setMapping] = useState<MappingState>({ entityType: null });
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [inboxItems, allProjects, allWorkItems] = await Promise.all([
      storage.getAll('inboxItems'),
      storage.getAll('projects'),
      storage.getAll('workItems')
    ]);
    setItems(inboxItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setProjects(allProjects);
    setWorkItems(allWorkItems);
  }

  const filteredItems = items.filter(item => {
    if (filter === 'unprocessed') return !item.processed;
    if (filter === 'processed') return item.processed;
    return true;
  });

  const handleSelectItem = (item: InboxItem) => {
    setSelectedItem(item);
    setStep(1);
    setMapping({ entityType: null });
    setError(null);
    setShowSuccess(false);
  };

  const handleClassify = (type: EntityType) => {
    setMapping({ entityType: type });
    setStep(2);
    // Try to suggest values based on raw text
    if (type === 'workItem') {
      suggestWorkItemFields(selectedItem!.rawText);
    } else if (type === 'project') {
      suggestProjectFields(selectedItem!.rawText);
    }
  };

  // Simple heuristic-based suggestions (no AI)
  const suggestWorkItemFields = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Detect type
    let suggestedType: WorkItemType = 'task';
    if (lowerText.includes('milestone')) suggestedType = 'milestone';
    else if (lowerText.includes('issue') || lowerText.includes('problem') || lowerText.includes('bug')) suggestedType = 'issue';
    else if (lowerText.includes('clash') || lowerText.includes('conflict')) suggestedType = 'clash';
    else if (lowerText.includes('remark') || lowerText.includes('note')) suggestedType = 'remark';
    else if (lowerText.includes('phase')) suggestedType = 'phase';
    
    // Detect status
    let suggestedStatus: Status = 'not_started';
    if (lowerText.includes('blocked') || lowerText.includes('blocker')) suggestedStatus = 'blocked';
    else if (lowerText.includes('in progress') || lowerText.includes('ongoing')) suggestedStatus = 'in_progress';
    else if (lowerText.includes('done') || lowerText.includes('completed')) suggestedStatus = 'done';
    
    // Extract dates (simple regex)
    const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    const suggestedDate = dateMatch ? dateMatch[1] : undefined;
    
    // Detect project by matching project names
    const suggestedProject = projects.find(p => 
      lowerText.includes(p.name.toLowerCase())
    )?.id;
    
    setMapping(prev => ({
      ...prev,
      workItemType: suggestedType,
      workItemStatus: suggestedStatus,
      workItemStartDate: suggestedDate,
      workItemProject: suggestedProject,
      workItemTitle: text.split('.')[0].substring(0, 100), // First sentence as title
      workItemNotes: text
    }));
  };

  const suggestProjectFields = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Detect status
    let suggestedStatus: Status = 'not_started';
    if (lowerText.includes('blocked')) suggestedStatus = 'blocked';
    else if (lowerText.includes('in progress')) suggestedStatus = 'in_progress';
    else if (lowerText.includes('done') || lowerText.includes('completed')) suggestedStatus = 'done';
    
    // Extract dates
    const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    const suggestedDate = dateMatch ? dateMatch[1] : undefined;
    
    setMapping(prev => ({
      ...prev,
      projectStatus: suggestedStatus,
      projectStartDate: suggestedDate,
      projectName: text.split('.')[0].substring(0, 80)
    }));
  };

  const handleReview = () => {
    setError(null);
    
    // Validation
    if (mapping.entityType === 'project') {
      if (!mapping.projectName?.trim()) {
        setError('Project name is required');
        return;
      }
      if (!mapping.projectOwner?.trim()) {
        setError('Project owner is required');
        return;
      }
    } else if (mapping.entityType === 'workItem') {
      if (!mapping.workItemProject) {
        setError('Project selection is required');
        return;
      }
      if (!mapping.workItemTitle?.trim()) {
        setError('Work item title is required');
        return;
      }
      if (!mapping.workItemType) {
        setError('Work item type is required');
        return;
      }
    }
    
    setStep(3);
  };

  const handleCommit = async () => {
    try {
      setError(null);
      
      if (mapping.entityType === 'project') {
        const newProject: Project = {
          id: generateId('proj'),
          name: mapping.projectName!,
          owner: mapping.projectOwner!,
          status: mapping.projectStatus || 'not_started',
          startDate: mapping.projectStartDate,
          endDate: mapping.projectEndDate,
          portfolioId: mapping.projectPortfolio || undefined,
          tags: mapping.projectTags ? mapping.projectTags.split(',').map(t => t.trim()) : []
        };
        await storage.add('projects', newProject);
      } else if (mapping.entityType === 'workItem') {
        const newWorkItem: WorkItem = {
          id: generateId('wi'),
          projectId: mapping.workItemProject!,
          type: mapping.workItemType!,
          title: mapping.workItemTitle!,
          status: mapping.workItemStatus || 'not_started',
          startDate: mapping.workItemStartDate,
          endDate: mapping.workItemEndDate,
          parentId: mapping.workItemParent || undefined,
          level: mapping.workItemParent ? 2 : 1,
          notes: mapping.workItemNotes,
          createdAt: new Date().toISOString()
        };
        await storage.add('workItems', newWorkItem);
      }
      
      // Mark inbox item as processed
      const updatedItem = { ...selectedItem!, processed: true };
      await storage.update('inboxItems', updatedItem);
      
      // Reload data
      await loadData();
      onInboxChange();
      
      // Show success and reset
      setShowSuccess(true);
      setTimeout(() => {
        setSelectedItem(null);
        setMapping({ entityType: null });
        setStep(1);
        setShowSuccess(false);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit');
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'link': return <LinkIcon className="w-4 h-4" />;
      case 'file': return <Upload className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex bg-white">
      {/* Left Panel - Inbox List */}
      <div className="w-2/5 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Inbox</h1>
          
          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter('unprocessed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unprocessed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Unprocessed ({items.filter(i => !i.processed).length})
            </button>
            <button
              onClick={() => setFilter('processed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'processed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Processed ({items.filter(i => i.processed).length})
            </button>
          </div>
        </div>

        {/* Inbox Items List */}
        <div className="flex-1 overflow-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No items in this view</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : item.processed
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.processed ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {getSourceIcon(item.sourceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 line-clamp-2 mb-2">
                        {item.rawText}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.processed && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Processed</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Detail & Mapping */}
      <div className="flex-1 flex flex-col">
        {!selectedItem ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Select an inbox item
              </h3>
              <p className="text-slate-500">
                Choose an item from the left to start processing
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Process Inbox Item</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setMapping({ entityType: null });
                    setStep(1);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  step === 1 ? 'bg-blue-100 text-blue-700' : step > 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className="font-medium text-sm">1. Classify</span>
                  {step > 1 && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  step === 2 ? 'bg-blue-100 text-blue-700' : step > 2 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className="font-medium text-sm">2. Extract</span>
                  {step > 2 && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  step === 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className="font-medium text-sm">3. Review</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Raw Text */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Raw Text
                </label>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedItem.rawText}
                  </p>
                </div>
              </div>

              {/* Step 1: Classify */}
              {step === 1 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Choose Entity Type
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleClassify('project')}
                      className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="font-semibold text-slate-900 mb-1">Project</div>
                      <p className="text-sm text-slate-600">
                        Create a new project with timeline and owner
                      </p>
                    </button>
                    <button
                      onClick={() => handleClassify('workItem')}
                      className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="font-semibold text-slate-900 mb-1">Work Item</div>
                      <p className="text-sm text-slate-600">
                        Add task, issue, milestone, or other work item
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Extract Fields - Project */}
              {step === 2 && mapping.entityType === 'project' && (
                <div>
                  <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Fields below have been auto-suggested. Review and edit as needed.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        value={mapping.projectName || ''}
                        onChange={(e) => setMapping({ ...mapping, projectName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter project name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Owner *
                      </label>
                      <input
                        type="text"
                        value={mapping.projectOwner || ''}
                        onChange={(e) => setMapping({ ...mapping, projectOwner: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter owner name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        value={mapping.projectStatus || 'not_started'}
                        onChange={(e) => setMapping({ ...mapping, projectStatus: e.target.value as Status })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={mapping.projectStartDate || ''}
                          onChange={(e) => setMapping({ ...mapping, projectStartDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={mapping.projectEndDate || ''}
                          onChange={(e) => setMapping({ ...mapping, projectEndDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={mapping.projectTags || ''}
                        onChange={(e) => setMapping({ ...mapping, projectTags: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="e.g., critical, migration, cloud"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Extract Fields - WorkItem */}
              {step === 2 && mapping.entityType === 'workItem' && (
                <div>
                  <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Fields below have been auto-suggested. Review and edit as needed.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Project *
                      </label>
                      <select
                        value={mapping.workItemProject || ''}
                        onChange={(e) => setMapping({ ...mapping, workItemProject: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">Select project...</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Type *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['task', 'issue', 'milestone', 'remark', 'clash', 'phase'] as WorkItemType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => setMapping({ ...mapping, workItemType: type })}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              mapping.workItemType === type
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={mapping.workItemTitle || ''}
                        onChange={(e) => setMapping({ ...mapping, workItemTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter work item title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        value={mapping.workItemStatus || 'not_started'}
                        onChange={(e) => setMapping({ ...mapping, workItemStatus: e.target.value as Status })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={mapping.workItemStartDate || ''}
                          onChange={(e) => setMapping({ ...mapping, workItemStartDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={mapping.workItemEndDate || ''}
                          onChange={(e) => setMapping({ ...mapping, workItemEndDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Parent Work Item (optional)
                      </label>
                      <select
                        value={mapping.workItemParent || ''}
                        onChange={(e) => setMapping({ ...mapping, workItemParent: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">None (top-level)</option>
                        {workItems
                          .filter(wi => wi.projectId === mapping.workItemProject && wi.level === 1)
                          .map(wi => (
                            <option key={wi.id} value={wi.id}>{wi.title}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={mapping.workItemNotes || ''}
                        onChange={(e) => setMapping({ ...mapping, workItemNotes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Review Changes</h3>
                  
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    {mapping.entityType === 'project' ? (
                      <div className="space-y-3">
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Action</span>
                          <p className="text-slate-900 mt-1">Create new Project</p>
                        </div>
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Name</span>
                          <p className="text-slate-900 mt-1">{mapping.projectName}</p>
                        </div>
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Owner</span>
                          <p className="text-slate-900 mt-1">{mapping.projectOwner}</p>
                        </div>
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Status</span>
                          <p className="text-slate-900 mt-1">
                            {mapping.projectStatus?.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                        {mapping.projectStartDate && (
                          <div className="pb-3 border-b border-slate-200">
                            <span className="text-sm font-medium text-slate-500">Timeline</span>
                            <p className="text-slate-900 mt-1">
                              {mapping.projectStartDate} → {mapping.projectEndDate || 'TBD'}
                            </p>
                          </div>
                        )}
                        {mapping.projectTags && (
                          <div>
                            <span className="text-sm font-medium text-slate-500">Tags</span>
                            <p className="text-slate-900 mt-1">{mapping.projectTags}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Action</span>
                          <p className="text-slate-900 mt-1">Create new Work Item</p>
                        </div>
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Project</span>
                          <p className="text-slate-900 mt-1">
                            {projects.find(p => p.id === mapping.workItemProject)?.name}
                          </p>
                        </div>
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Type</span>
                          <p className="text-slate-900 mt-1">
                            {mapping.workItemType?.toUpperCase()}
                          </p>
                        </div>
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Title</span>
                          <p className="text-slate-900 mt-1">{mapping.workItemTitle}</p>
                        </div>
                        <div className="pb-3 border-b border-slate-200">
                          <span className="text-sm font-medium text-slate-500">Status</span>
                          <p className="text-slate-900 mt-1">
                            {mapping.workItemStatus?.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                        {(mapping.workItemStartDate || mapping.workItemEndDate) && (
                          <div className="pb-3 border-b border-slate-200">
                            <span className="text-sm font-medium text-slate-500">Timeline</span>
                            <p className="text-slate-900 mt-1">
                              {mapping.workItemStartDate || 'TBD'} → {mapping.workItemEndDate || 'TBD'}
                            </p>
                          </div>
                        )}
                        {mapping.workItemParent && (
                          <div className="pb-3 border-b border-slate-200">
                            <span className="text-sm font-medium text-slate-500">Parent</span>
                            <p className="text-slate-900 mt-1">
                              {workItems.find(wi => wi.id === mapping.workItemParent)?.title}
                            </p>
                          </div>
                        )}
                        {mapping.workItemNotes && (
                          <div>
                            <span className="text-sm font-medium text-slate-500">Notes</span>
                            <p className="text-slate-900 mt-1">{mapping.workItemNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Display */}
              {showSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Success!</p>
                    <p className="text-sm text-green-700 mt-1">
                      {mapping.entityType === 'project' ? 'Project' : 'Work item'} created successfully
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {!showSuccess && (
              <div className="p-6 border-t border-slate-200 bg-white">
                <div className="flex gap-3">
                  {step > 1 && (
                    <button
                      onClick={() => setStep((step - 1) as 1 | 2)}
                      className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      onClick={() => step === 2 ? handleReview() : null}
                      disabled={step === 1 || !mapping.entityType}
                      className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleCommit}
                      className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Commit
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
