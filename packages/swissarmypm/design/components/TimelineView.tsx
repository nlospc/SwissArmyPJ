import { useEffect, useRef, useState } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { 
  Download, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  Info,
  Maximize2,
  Search,
  Plus
} from 'lucide-react';

interface TaskRow {
  id: string;
  type: 'REQUEST' | 'TASK' | 'PHASE' | 'MILESTONE';
  subject: string;
  status: 'Resolved' | 'In progress' | 'Not started' | 'Blocked';
  startDate: string;
  finishDate: string;
  duration: string;
  assignee: string;
}

const mockTaskRows: TaskRow[] = [
  {
    id: '162309',
    type: 'REQUEST',
    subject: 'Requirements gathering and analysis',
    status: 'Resolved',
    startDate: '10/15/2025',
    finishDate: '10/30/2025',
    duration: '12 days',
    assignee: 'Alex Chen'
  },
  {
    id: '162041',
    type: 'TASK',
    subject: 'Database schema design and review',
    status: 'In progress',
    startDate: '12/15/2025',
    finishDate: '12/31/2025',
    duration: '13 days',
    assignee: 'Pat Kim'
  },
  {
    id: '162040',
    type: 'PHASE',
    subject: 'System architecture planning',
    status: 'In progress',
    startDate: '12/15/2025',
    finishDate: '12/15/2025',
    duration: '',
    assignee: 'Sam Taylor'
  },
  {
    id: '162042',
    type: 'TASK',
    subject: 'API integration and testing workflow',
    status: 'In progress',
    startDate: '12/19/2025',
    finishDate: '12/26/2025',
    duration: '6 days',
    assignee: 'Jordan Lee'
  },
  {
    id: '162039',
    type: 'TASK',
    subject: 'Security audit implementation',
    status: 'In progress',
    startDate: '01/15/2026',
    finishDate: '',
    duration: '',
    assignee: 'Riley Morgan'
  },
  {
    id: '162043',
    type: 'MILESTONE',
    subject: 'Design phase complete',
    status: 'Not started',
    startDate: '03/15/2026',
    finishDate: '03/15/2026',
    duration: '',
    assignee: 'Technical Team'
  },
  {
    id: '162044',
    type: 'TASK',
    subject: 'Frontend component development',
    status: 'Not started',
    startDate: '03/20/2026',
    finishDate: '05/10/2026',
    duration: '38 days',
    assignee: 'Morgan Davis'
  },
  {
    id: '162045',
    type: 'TASK',
    subject: 'Backend API development',
    status: 'Not started',
    startDate: '03/17/2026',
    finishDate: '05/15/2026',
    duration: '45 days',
    assignee: 'Casey Brown'
  }
];

const timelineItems = [
  {
    id: '162309',
    content: '10/15 - 10/30',
    start: '2025-10-15',
    end: '2025-10-30',
    type: 'range' as const,
    className: 'status-done',
    title: 'Requirements gathering and analysis'
  },
  {
    id: '162041',
    content: '12/15 - 12/31',
    start: '2025-12-15',
    end: '2025-12-31',
    type: 'range' as const,
    className: 'status-in-progress',
    title: 'Database schema design and review'
  },
  {
    id: '162040',
    content: '12/15',
    start: '2025-12-15',
    end: '2025-12-15',
    type: 'point' as const,
    className: 'milestone-in-progress',
    title: 'System architecture planning'
  },
  {
    id: '162042',
    content: '12/19 - 12/26',
    start: '2025-12-19',
    end: '2025-12-26',
    type: 'range' as const,
    className: 'status-in-progress',
    title: 'API integration and testing workflow'
  },
  {
    id: '162039',
    content: '01/15',
    start: '2026-01-15',
    end: '2026-01-30',
    type: 'range' as const,
    className: 'status-in-progress',
    title: 'Security audit implementation'
  },
  {
    id: '162043',
    content: '03/15',
    start: '2026-03-15',
    end: '2026-03-15',
    type: 'point' as const,
    className: 'milestone-upcoming',
    title: 'Design phase complete'
  },
  {
    id: '162044',
    content: '03/20 - 05/10',
    start: '2026-03-20',
    end: '2026-05-10',
    type: 'range' as const,
    className: 'status-not-started',
    title: 'Frontend component development'
  },
  {
    id: '162045',
    content: '03/17 - 05/15',
    start: '2026-03-17',
    end: '2026-05-15',
    type: 'range' as const,
    className: 'status-not-started',
    title: 'Backend API development'
  }
];

export function TimelineView() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  useEffect(() => {
    if (!timelineRef.current) return;

    const options = {
      width: '100%',
      height: '100%',
      stack: false,
      showMajorLabels: true,
      showMinorLabels: true,
      showCurrentTime: true,
      zoomMin: 1000 * 60 * 60 * 24 * 7, // 1 week
      zoomMax: 1000 * 60 * 60 * 24 * 365, // 1 year
      type: 'range' as const,
      format: {
        minorLabels: {
          day: 'D',
          week: 'w',
          month: 'MMM'
        },
        majorLabels: {
          day: 'MMMM',
          week: 'MMMM YYYY',
          month: 'YYYY'
        }
      },
      margin: {
        item: {
          horizontal: 0,
          vertical: 8
        }
      },
      orientation: 'top',
      selectable: true,
      verticalScroll: true,
      horizontalScroll: true,
    };

    timelineInstance.current = new Timeline(
      timelineRef.current,
      timelineItems,
      options
    );

    // Set initial view
    timelineInstance.current.setWindow(
      new Date('2025-10-01'),
      new Date('2026-06-30')
    );

    // Handle selection
    timelineInstance.current.on('select', (properties) => {
      if (properties.items.length > 0) {
        setSelectedRow(properties.items[0]);
      } else {
        setSelectedRow(null);
      }
    });

    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
      }
    };
  }, []);

  const handleZoomIn = () => {
    if (timelineInstance.current) {
      timelineInstance.current.zoomIn(0.5);
    }
  };

  const handleZoomOut = () => {
    if (timelineInstance.current) {
      timelineInstance.current.zoomOut(0.5);
    }
  };

  const handleFit = () => {
    if (timelineInstance.current) {
      timelineInstance.current.fit();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'text-green-700 bg-green-50';
      case 'In progress':
        return 'text-blue-700 bg-blue-50';
      case 'Blocked':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MILESTONE':
        return 'text-purple-700 bg-purple-50';
      case 'PHASE':
        return 'text-orange-700 bg-orange-50';
      case 'REQUEST':
        return 'text-cyan-700 bg-cyan-50';
      default:
        return 'text-blue-700 bg-blue-50';
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedRow(id);
    if (timelineInstance.current) {
      timelineInstance.current.setSelection(id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900">All open</h1>
            <div className="text-sm text-slate-500">
              CSPR-Project / Gantt charts / Default: All open
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              Create
            </button>

            <select className="px-3 py-1.5 border border-slate-300 rounded text-sm bg-white">
              <option>Include projects: 1</option>
            </select>

            <select className="px-3 py-1.5 border border-slate-300 rounded text-sm bg-white">
              <option>Baseline</option>
            </select>

            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-sm transition-colors">
              <Filter className="w-4 h-4" />
              Filter: 1
            </button>

            <div className="flex items-center border border-slate-300 rounded">
              <button className="p-1.5 hover:bg-slate-50 transition-colors" title="Info">
                <Info className="w-4 h-4 text-slate-600" />
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <button className="p-1.5 hover:bg-slate-50 transition-colors" title="Search">
                <Search className="w-4 h-4 text-slate-600" />
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <button 
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-50 transition-colors" 
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <button 
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-50 transition-colors" 
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <button className="p-1.5 hover:bg-slate-50 transition-colors" title="Fullscreen">
                <Maximize2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <button className="p-1.5 border border-slate-300 hover:bg-slate-50 rounded transition-colors">
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Split View: Table + Timeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Table */}
        <div className="w-1/2 border-r border-slate-200 flex flex-col bg-white overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
              <div className="col-span-1">ID</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-3">Subject</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Start Date</div>
              <div className="col-span-2">Finish Date</div>
              <div className="col-span-1">Duration</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto">
            {mockTaskRows.map((row, index) => (
              <div
                key={row.id}
                onClick={() => handleRowClick(row.id)}
                className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                  selectedRow === row.id ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <div className="col-span-1 text-sm text-blue-600 font-medium">{row.id}</div>
                <div className="col-span-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(row.type)}`}>
                    {row.type}
                  </span>
                </div>
                <div className="col-span-3 text-sm text-slate-900 truncate" title={row.subject}>
                  {row.subject}
                </div>
                <div className="col-span-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(row.status)}`}>
                    {row.status}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-slate-600">{row.startDate}</div>
                <div className="col-span-2 text-sm text-slate-600">{row.finishDate}</div>
                <div className="col-span-1 text-sm text-slate-600">{row.duration}</div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="border-t border-slate-200 px-4 py-2 bg-slate-50">
            <div className="text-xs text-slate-500">
              (1 - {mockTaskRows.length})
            </div>
          </div>
        </div>

        {/* Right Panel - Gantt Timeline */}
        <div className="w-1/2 bg-slate-50 overflow-hidden">
          <div 
            ref={timelineRef} 
            className="h-full timeline-container-openproject"
          />
        </div>
      </div>
    </div>
  );
}
