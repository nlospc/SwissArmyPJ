import { useState } from 'react';
import { useStore } from './store';
import { CloudArrowUpIcon, CheckCircleIcon, XCircleIcon, ClockIcon, DocumentIcon } from './icons';
import { formatDate } from './utils';

interface FileItem {
  id: string;
  name: string;
  uploadedAt: Date;
  processedAt: Date | null;
  status: 'processed' | 'pending' | 'failed';
  tasksExtracted?: number;
  datesExtracted?: number;
  projectsExtracted?: number;
  error?: string;
}

const MOCK_FILES: FileItem[] = [
  {
    id: '1',
    name: 'meeting-notes-2026-01-24.md',
    uploadedAt: new Date('2026-01-24T18:15:00'),
    processedAt: new Date('2026-01-24T18:30:00'),
    status: 'processed',
    tasksExtracted: 5,
    datesExtracted: 3,
    projectsExtracted: 1,
  },
  {
    id: '2',
    name: 'project-tasks-import.csv',
    uploadedAt: new Date('2026-01-23T23:30:00'),
    processedAt: new Date('2026-01-23T23:45:00'),
    status: 'processed',
    tasksExtracted: 23,
    datesExtracted: 46,
    projectsExtracted: 0,
  },
  {
    id: '3',
    name: 'weekly-summary.md',
    uploadedAt: new Date('2026-01-25T00:00:00'),
    processedAt: null,
    status: 'pending',
  },
  {
    id: '4',
    name: 'invalid-format.txt',
    uploadedAt: new Date('2026-01-22T17:15:00'),
    processedAt: new Date('2026-01-22T17:20:00'),
    status: 'failed',
    error: 'Unable to parse file format. Expected MD or CSV.',
  },
];

export function InboxPage() {
  const [files, setFiles] = useState<FileItem[]>(MOCK_FILES);
  const [isDragging, setIsDragging] = useState(false);

  const pendingFiles = files.filter(f => f.status === 'pending').length;
  const processedFiles = files.filter(f => f.status === 'processed').length;
  const totalTasksExtracted = files.reduce((sum, f) => sum + (f.tasksExtracted || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const getStatusBadge = (status: FileItem['status']) => {
    switch (status) {
      case 'processed':
        return (
          <span className="badge badge-completed">
            <CheckCircleIcon className="w-3 h-3" />
            Processed
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-pending">
            <ClockIcon className="w-3 h-3" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-failed">
            <XCircleIcon className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-1">Inbox</h1>
          <p className="section-subtitle">
            Import files to extract tasks and project updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">
            Process All
          </button>
          <button className="btn btn-primary">
            <CloudArrowUpIcon className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Upload Area */}
        <div
          className={`mb-6 p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
            isDragging
              ? 'border-primary bg-badge-active'
              : 'border-border-light bg-white hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudArrowUpIcon className="w-12 h-12 text-text-muted mb-4" />
          <p className="text-base font-medium text-text-primary mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-text-tertiary mb-3">
            Supported formats: Markdown (.md), CSV (.csv), Text (.txt)
          </p>
          <p className="text-xs text-text-secondary">
            Files will be automatically parsed for tasks, dates, and project updates
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-start justify-between mb-2">
              <span className="text-3xl font-bold text-text-primary">{pendingFiles}</span>
              <DocumentIcon className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-xs text-text-tertiary">Pending Files</p>
          </div>
          <div className="stat-card">
            <div className="flex items-start justify-between mb-2">
              <span className="text-3xl font-bold text-text-primary">{processedFiles}</span>
              <CheckCircleIcon className="w-5 h-5 text-success" />
            </div>
            <p className="text-xs text-text-tertiary">Processed Files</p>
          </div>
          <div className="stat-card">
            <div className="flex items-start justify-between mb-2">
              <span className="text-3xl font-bold text-text-primary">{totalTasksExtracted}</span>
              <CheckCircleIcon className="w-5 h-5 text-success" />
            </div>
            <p className="text-xs text-text-tertiary">Tasks Extracted</p>
          </div>
        </div>

        {/* Recent Files */}
        <div className="flex gap-6">
          {/* Files List */}
          <div className="flex-1">
            <div className="card">
              <h2 className="text-base font-semibold text-text-primary mb-4">
                Recent Files
              </h2>
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <DocumentIcon className="w-5 h-5 text-text-muted flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-text-primary truncate">
                              {file.name}
                            </h3>
                            {getStatusBadge(file.status)}
                          </div>
                          {file.status === 'processed' && file.processedAt && (
                            <div className="flex items-center gap-4 text-xs text-text-tertiary">
                              <span>Uploaded {formatDate(file.uploadedAt)}</span>
                              <span>•</span>
                              <span>Processed {formatDate(file.processedAt)}</span>
                            </div>
                          )}
                          {file.status === 'pending' && (
                            <div className="flex items-center gap-4 text-xs text-text-tertiary">
                              <span>Uploaded {formatDate(file.uploadedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="btn btn-ghost p-1 text-text-tertiary">
                        •••
                      </button>
                    </div>

                    {/* Extracted Data */}
                    {file.status === 'processed' && (
                      <div className="flex items-center gap-4">
                        {file.tasksExtracted !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-text-secondary">
                              {file.tasksExtracted}
                            </span>
                            <span className="text-xs text-text-tertiary">tasks</span>
                          </div>
                        )}
                        {file.datesExtracted !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-text-secondary">
                              {file.datesExtracted}
                            </span>
                            <span className="text-xs text-text-tertiary">dates</span>
                          </div>
                        )}
                        {file.projectsExtracted !== undefined && file.projectsExtracted > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-text-secondary">
                              {file.projectsExtracted}
                            </span>
                            <span className="text-xs text-text-tertiary">projects</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {file.status === 'failed' && file.error && (
                      <div className="mt-3 p-2 bg-badge-failed border border-border-medium rounded flex items-start gap-2">
                        <XCircleIcon className="w-4 h-4 text-badge-failed-text flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-badge-failed-text">{file.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="w-[400px] flex-shrink-0">
            <div className="p-4 bg-badge-active border border-badge-active border-opacity-30 rounded-xl">
              <h3 className="text-base font-semibold text-badge-active-text mb-4">
                How it works
              </h3>
              <ul className="space-y-3">
                <li className="text-sm text-badge-active-text flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Drop Markdown files with meeting notes or project summaries
                  </span>
                </li>
                <li className="text-sm text-badge-active-text flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Import CSV files with task lists (columns: name, start_date,
                    end_date, duration, status)
                  </span>
                </li>
                <li className="text-sm text-badge-active-text flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Files are automatically parsed to extract tasks, dates, and
                    dependencies
                  </span>
                </li>
                <li className="text-sm text-badge-active-text flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Review extracted data and approve changes to your project plan
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
