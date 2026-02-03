import React, { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useUIStore } from '@/stores/useUIStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { Project, WorkItem } from '@/shared/types';

export function ProjectsPage() {
  const { projects } = useProjectStore();
  const { workItemsByProject, loadWorkItemsByProject } = useWorkItemStore();
  const { selectedProjectId, setSelectedProjectId } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.owner && p.owner.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectProject = async (project: Project) => {
    setSelectedProjectId(project.id);
    await loadWorkItemsByProject(project.id);
  };

  const toggleExpand = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done': return <Badge className="bg-green-600">Done</Badge>;
      case 'in_progress': return <Badge className="bg-blue-600">In Progress</Badge>;
      case 'blocked': return <Badge variant="destructive">Blocked</Badge>;
      case 'not_started': return <Badge variant="secondary">Not Started</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      task: 'bg-blue-100 text-blue-800',
      issue: 'bg-red-100 text-red-800',
      milestone: 'bg-purple-100 text-purple-800',
      phase: 'bg-green-100 text-green-800',
      remark: 'bg-yellow-100 text-yellow-800',
      clash: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={colors[type] || ''}>{type}</Badge>;
  };

  const renderWorkItem = (item: WorkItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 p-2 hover:bg-accent rounded ${depth > 0 ? 'ml-8' : ''}`}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpand(item.id)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          {!hasChildren && <div className="w-6" />}

          <div className="flex-1 flex items-center gap-2">
            {getTypeBadge(item.type)}
            <span className="font-medium">{item.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {item.start_date && item.end_date && (
              <span className="text-xs text-muted-foreground">
                {item.start_date} → {item.end_date}
              </span>
            )}
            {getStatusBadge(item.status)}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderWorkItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const workItems = selectedProjectId ? workItemsByProject.get(selectedProjectId) || [] : [];

  return (
    <div className="flex h-full">
      {/* Left Panel - Project List */}
      <div className="w-96 border-r border-border p-4 space-y-4 overflow-auto">
        <div>
          <h2 className="text-xl font-bold mb-4">Projects</h2>
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Project</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center text-muted-foreground py-8">No projects found</td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className={`border-b last:border-0 cursor-pointer transition-colors ${
                      selectedProjectId === project.id
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : 'hover:bg-muted/40'
                    }`}
                    onClick={() => handleSelectProject(project)}
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{project.name}</span>
                      {project.owner && (
                        <p className="text-xs text-muted-foreground">{project.owner}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{getStatusBadge(project.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Panel - Project Details & Work Items */}
      <div className="flex-1 p-8 overflow-auto">
        {!selectedProject ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Select a project</p>
              <p className="text-sm mt-2">Choose a project from the left panel to view details</p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Project Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
                  {selectedProject.owner && (
                    <p className="text-muted-foreground mt-1">Owner: {selectedProject.owner}</p>
                  )}
                </div>
                {getStatusBadge(selectedProject.status)}
              </div>

              {selectedProject.description && (
                <p className="text-muted-foreground mb-4">{selectedProject.description}</p>
              )}

              <div className="flex gap-4 text-sm">
                {selectedProject.start_date && (
                  <div>
                    <span className="font-medium">Start:</span> {selectedProject.start_date}
                  </div>
                )}
                {selectedProject.end_date && (
                  <div>
                    <span className="font-medium">End:</span> {selectedProject.end_date}
                  </div>
                )}
              </div>

              {selectedProject.tags && selectedProject.tags.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {selectedProject.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Work Items */}
            <Card>
              <CardHeader>
                <CardTitle>Work Items</CardTitle>
              </CardHeader>
              <CardContent>
                {workItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No work items found for this project
                  </p>
                ) : (
                  <div className="space-y-1">
                    {workItems.map(item => renderWorkItem(item))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
