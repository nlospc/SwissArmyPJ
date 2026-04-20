import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Input, Progress, Segmented, Space, Tag, Typography } from 'antd';
import { ArrowRightOutlined, CalendarOutlined, FolderOpenOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';

import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useUIStore } from '@/stores/useUIStore';
import { useI18n } from '@/hooks/useI18n';
import type { Project, WorkItem } from '@/shared/types';

const { Title, Text, Paragraph } = Typography;

type StatusFilter = 'all' | Project['status'];

type Copy = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  currentProjects: string;
  noProjects: string;
  total: string;
  active: string;
  blocked: string;
  done: string;
  owners: string;
  progress: string;
  workItems: string;
  nextMilestone: string;
  openWorkbench: string;
  noMilestone: string;
  unassignedOwner: string;
  ungrouped: string;
  healthBlocked: string;
  healthMoving: string;
  healthStable: string;
  healthPending: string;
  statusLabels: Record<Project['status'], string>;
  filterLabels: Record<StatusFilter, string>;
};

const copyByLanguage: Record<'zh' | 'en', Copy> = {
  zh: {
    title: '项目列表',
    subtitle: '先找到项目，再进入工作台维护项目当前事实。',
    searchPlaceholder: '搜索项目名、负责人、标签',
    currentProjects: '当前项目',
    noProjects: '没有符合条件的项目',
    total: '项目总数',
    active: '推进中',
    blocked: '受阻',
    done: '已完成',
    owners: '负责人',
    progress: '完成度',
    workItems: '工作项',
    nextMilestone: '下个里程碑',
    openWorkbench: '进入工作台',
    noMilestone: '暂无',
    unassignedOwner: '待分配负责人',
    ungrouped: '未分组',
    healthBlocked: '高风险',
    healthMoving: '推进中',
    healthStable: '稳定',
    healthPending: '待启动',
    statusLabels: {
      not_started: '未开始',
      in_progress: '进行中',
      done: '已完成',
      blocked: '受阻',
    },
    filterLabels: {
      all: '全部',
      not_started: '未开始',
      in_progress: '进行中',
      done: '已完成',
      blocked: '受阻',
    },
  },
  en: {
    title: 'Projects',
    subtitle: 'Start from the project list, then move into the workbench to maintain current facts.',
    searchPlaceholder: 'Search by project, owner, or tag',
    currentProjects: 'Current Projects',
    noProjects: 'No projects match the current filter',
    total: 'Total Projects',
    active: 'Active',
    blocked: 'Blocked',
    done: 'Done',
    owners: 'Owners',
    progress: 'Progress',
    workItems: 'Work Items',
    nextMilestone: 'Next Milestone',
    openWorkbench: 'Open Workbench',
    noMilestone: 'None',
    unassignedOwner: 'Owner TBD',
    ungrouped: 'Ungrouped',
    healthBlocked: 'High Risk',
    healthMoving: 'Moving',
    healthStable: 'Stable',
    healthPending: 'Pending',
    statusLabels: {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      done: 'Done',
      blocked: 'Blocked',
    },
    filterLabels: {
      all: 'All',
      not_started: 'Not Started',
      in_progress: 'In Progress',
      done: 'Done',
      blocked: 'Blocked',
    },
  },
};

const statusColorMap: Record<Project['status'], string> = {
  not_started: 'default',
  in_progress: 'processing',
  done: 'success',
  blocked: 'error',
};

function getProjectProgress(workItems: WorkItem[]): number {
  if (workI
