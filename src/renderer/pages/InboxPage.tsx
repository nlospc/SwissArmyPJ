import React, { useState } from 'react';
import { useInboxStore } from '@/stores/useInboxStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InboxItem, CreateProjectDTO, CreateWorkItemDTO } from '@/shared/types';

type Step = 'classify' | 'extract' | 'review';
type EntityType = 'project' | 'work_item';

export function InboxPage() {
  const { inboxItems, markAsProcessed, createInboxItem } = useInboxStore();
  const { projects, createProject } = useProjectStore();

  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('classify');
  const [entityType, setEntityType] = useState<EntityType>('work_item');
  const [formData, setFormData] = useState<any>({});
  const [newItemText, setNewItemText] = useState('');

  const unprocessedItems = inboxItems.filter(item => item.processed === 0);
  const processedItems = inboxItems.filter(item => item.processed === 1);

  const handleSelectItem = (item: InboxItem) => {
    setSelectedItem(item);
    setCurrentStep('classify');
    setFormData({});
  };

  const handleClassify = (type: EntityType) => {
    setEntityType(type);
    // Auto-extract fields
    const extracted = autoExtract(selectedItem!.raw_text, type);
    setFormData(extracted);
    setCurrentStep('extract');
  };

  const autoExtract = (text: string, type: EntityType) => {
    const data: any = {};

    // Extract status
    const statusMatches = text.match(/\b(blocked|in progress|done|not started)\b/i);
    if (statusMatches) {
      data.status = statusMatches[1].toLowerCase().replace(' ', '_');
    }

    // Extract dates
    const dateMatches = text.match(/\b(\d{4}-\d{2}-\d{2})\b/g);
    if (dateMatches && dateMatches.length > 0) {
      data.start_date = dateMatches[0];
      if (dateMatches.length > 1) {
        data.end_date = dateMatches[1];
      }
    }

    // Extract work item type
    if (type === 'work_item') {
      if (text.match(/\b(milestone|deliverable)\b/i)) {
        data.type = 'milestone';
      } else if (text.match(/\b(issue|bug|problem|blocker)\b/i)) {
        data.type = 'issue';
      } else if (text.match(/\b(phase|stage)\b/i)) {
        data.type = 'phase';
      } else if (text.match(/\b(clash|conflict|risk)\b/i)) {
        data.type = 'clash';
      } else if (text.match(/\b(remark|note|comment)\b/i)) {
        data.type = 'remark';
      } else {
        data.type = 'task';
      }

      // Try to match project
      const projectMatch = projects.find(p =>
        text.toLowerCase().includes(p.name.toLowerCase())
      );
      if (projectMatch) {
        data.project_id = projectMatch.id;
      }
    }

    // Use first sentence or first 100 chars as title/name
    const firstSentence = text.split(/[.!?]/)[0].trim();
    data.title = firstSentence.substring(0, 100);
    data.name = firstSentence.substring(0, 100);

    return data;
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    if (entityType === 'project') {
      const projectData: CreateProjectDTO = {
        name: formData.name || formData.title || 'Untitled Project',
        status: formData.status || 'not_started',
        start_date: formData.start_date,
        end_date: formData.end_date,
        owner: formData.owner,
      };
      await createProject(projectData);
    } else {
      const workItemData: CreateWorkItemDTO = {
        project_id: formData.project_id || projects[0]?.id || 1,
        type: formData.type || 'task',
        title: formData.title || 'Untitled Work Item',
        status: formData.status || 'not_started',
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: selectedItem.raw_text,
      };

      // Note: In real implementation, would call workItems.create
      // For now, just mark as processed
    }

    await markAsProcessed(selectedItem.id);
    setSelectedItem(null);
    setCurrentStep('classify');
    setFormData({});
  };

  const handleAddInboxItem = async () => {
    if (!newItemText.trim()) return;
    await createInboxItem({
      source_type: 'text',
      raw_text: newItemText,
    });
    setNewItemText('');
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Inbox List */}
      <div className="w-96 border-r border-border p-4 space-y-4 overflow-auto">
        <div>
          <h2 className="text-xl font-bold mb-2">Inbox</h2>
          <div className="space-y-2">
            <Textarea
              placeholder="Add new inbox item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddInboxItem} className="w-full">
              Add to Inbox
            </Button>
          </div>
        </div>

        <Tabs defaultValue="unprocessed">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unprocessed">
              Unprocessed
              {unprocessedItems.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unprocessedItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
          </TabsList>

          <TabsContent value="unprocessed" className="mt-3">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {unprocessedItems.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center text-muted-foreground py-8">No unprocessed items</td>
                    </tr>
                  ) : (
                    unprocessedItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b last:border-0 cursor-pointer transition-colors ${
                          selectedItem?.id === item.id
                            ? 'bg-primary/10 border-l-2 border-l-primary'
                            : 'hover:bg-muted/40'
                        }`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <td className="px-3 py-2.5 line-clamp-2">{item.raw_text}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="processed" className="mt-3">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {processedItems.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center text-muted-foreground py-8">No processed items</td>
                    </tr>
                  ) : (
                    processedItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 opacity-60">
                        <td className="px-3 py-2.5">{item.raw_text}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Processing Workflow */}
      <div className="flex-1 p-8 overflow-auto">
        {!selectedItem ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Select an inbox item to process</p>
              <p className="text-sm mt-2">Choose an item from the left panel</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className={`flex items-center gap-2 ${currentStep === 'classify' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'classify' ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  1
                </div>
                <span>Classify</span>
              </div>
              <div className="w-12 h-0.5 bg-border" />
              <div className={`flex items-center gap-2 ${currentStep === 'extract' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'extract' ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  2
                </div>
                <span>Extract</span>
              </div>
              <div className="w-12 h-0.5 bg-border" />
              <div className={`flex items-center gap-2 ${currentStep === 'review' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'review' ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  3
                </div>
                <span>Review</span>
              </div>
            </div>

            {/* Original Text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Original Inbox Item</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted p-3 rounded">{selectedItem.raw_text}</p>
              </CardContent>
            </Card>

            {/* Step 1: Classify */}
            {currentStep === 'classify' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Classify Entity Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    What type of entity should this create?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2"
                      onClick={() => handleClassify('project')}
                    >
                      <span className="text-lg font-semibold">Project</span>
                      <span className="text-xs text-muted-foreground">A new project container</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2"
                      onClick={() => handleClassify('work_item')}
                    >
                      <span className="text-lg font-semibold">Work Item</span>
                      <span className="text-xs text-muted-foreground">Task, issue, milestone, etc.</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Extract */}
            {currentStep === 'extract' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Extract Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title / Name</Label>
                    <Input
                      id="title"
                      value={formData.title || formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, [entityType === 'project' ? 'name' : 'title']: e.target.value })}
                    />
                  </div>

                  {entityType === 'work_item' && (
                    <>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <NativeSelect
                          id="type"
                          value={formData.type || ''}
                          onChange={(value) => setFormData({ ...formData, type: value })}
                          placeholder="Select type"
                          options={[
                            { value: 'task', label: 'Task' },
                            { value: 'issue', label: 'Issue' },
                            { value: 'milestone', label: 'Milestone' },
                            { value: 'phase', label: 'Phase' },
                            { value: 'remark', label: 'Remark' },
                            { value: 'clash', label: 'Clash' },
                          ]}
                        />
                      </div>

                      <div>
                        <Label htmlFor="project">Project</Label>
                        <NativeSelect
                          id="project"
                          value={formData.project_id?.toString() || ''}
                          onChange={(value) => setFormData({ ...formData, project_id: parseInt(value) })}
                          placeholder="Select project"
                          options={projects.map((p) => ({ value: p.id.toString(), label: p.name }))}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <NativeSelect
                      id="status"
                      value={formData.status || ''}
                      onChange={(value) => setFormData({ ...formData, status: value })}
                      placeholder="Select status"
                      options={[
                        { value: 'not_started', label: 'Not Started' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'done', label: 'Done' },
                        { value: 'blocked', label: 'Blocked' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setCurrentStep('classify')}>
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep('review')}>
                      Next: Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 'review' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Review & Commit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded space-y-2">
                    <p className="font-semibold">
                      Creating {entityType === 'project' ? 'Project' : 'Work Item'}
                    </p>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Title:</span> {formData.title || formData.name}</p>
                      {formData.type && <p><span className="font-medium">Type:</span> {formData.type}</p>}
                      {formData.status && <p><span className="font-medium">Status:</span> {formData.status}</p>}
                      {formData.start_date && <p><span className="font-medium">Start:</span> {formData.start_date}</p>}
                      {formData.end_date && <p><span className="font-medium">End:</span> {formData.end_date}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setCurrentStep('extract')}>
                      Back
                    </Button>
                    <Button onClick={handleSubmit}>
                      Commit & Mark Processed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
