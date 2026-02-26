import { useState, useEffect, useCallback } from 'react';
import { AppState, Project, Category, RecordItem } from '../types';
import { generateId } from '../utils';

const STORAGE_KEY = 'project_archive_data';

const defaultState: AppState = {
  projects: [
    { id: 'p1', name: '示例项目', order: 0 }
  ],
  categories: [
    { id: 'c1', projectId: 'p1', name: '需求', order: 0 },
    { id: 'c2', projectId: 'p1', name: '设计', order: 1 },
    { id: 'c3', projectId: 'p1', name: '开发', order: 2 },
    { id: 'c4', projectId: 'p1', name: '测试', order: 3 },
  ],
  records: [
    {
      id: 'r1',
      projectId: 'p1',
      categoryId: 'c1',
      title: '完成需求调研',
      content: '包括竞品分析和用户访谈',
      type: 'milestone',
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      order: 0,
    },
    {
      id: 'r2',
      projectId: 'p1',
      categoryId: 'c3',
      title: '搭建基础框架',
      content: 'React + TailwindCSS',
      type: 'todo',
      createdAt: Date.now(),
      order: 1,
    }
  ]
};

export function useStore() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: add projectId to categories if missing
        if (parsed.categories && parsed.projects && parsed.projects.length > 0) {
          const defaultProjectId = parsed.projects[0].id;
          parsed.categories = parsed.categories.map((c: any) => ({
            ...c,
            projectId: c.projectId || defaultProjectId
          }));
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addProject = useCallback((name: string) => {
    setState(prev => {
      const newProjectId = generateId();
      const newProject = { id: newProjectId, name, order: prev.projects.length };
      const defaultCategories = [
        { id: generateId(), projectId: newProjectId, name: '需求', order: 0 },
        { id: generateId(), projectId: newProjectId, name: '设计', order: 1 },
        { id: generateId(), projectId: newProjectId, name: '开发', order: 2 },
        { id: generateId(), projectId: newProjectId, name: '测试', order: 3 },
      ];
      return {
        ...prev,
        projects: [...prev.projects, newProject],
        categories: [...prev.categories, ...defaultCategories]
      };
    });
  }, []);

  const updateProject = useCallback((id: string, name: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, name } : p)
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      categories: prev.categories.filter(c => c.projectId !== id),
      records: prev.records.filter(r => r.projectId !== id)
    }));
  }, []);

  const reorderProjects = useCallback((newProjects: Project[]) => {
    setState(prev => ({ ...prev, projects: newProjects }));
  }, []);

  const addCategory = useCallback((name: string, projectId: string) => {
    setState(prev => {
      const projectCategories = prev.categories.filter(c => c.projectId === projectId);
      return {
        ...prev,
        categories: [...prev.categories, { id: generateId(), projectId, name, order: projectCategories.length }]
      };
    });
  }, []);

  const updateCategory = useCallback((id: string, name: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, name } : c)
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      records: prev.records.filter(r => r.categoryId !== id)
    }));
  }, []);

  const reorderCategories = useCallback((newCategories: Category[]) => {
    setState(prev => {
      // newCategories contains the reordered categories for a specific project
      // We need to update their orders in the global state
      const updatedCategories = prev.categories.map(c => {
        const newCat = newCategories.find(nc => nc.id === c.id);
        return newCat ? { ...c, order: newCat.order } : c;
      });
      return { ...prev, categories: updatedCategories };
    });
  }, []);

  const addRecord = useCallback((record: Omit<RecordItem, 'id' | 'createdAt' | 'order'>) => {
    setState(prev => {
      const projectRecords = prev.records.filter(r => r.projectId === record.projectId && r.categoryId === record.categoryId);
      const newRecord: RecordItem = {
        ...record,
        id: generateId(),
        createdAt: Date.now(),
        order: projectRecords.length
      };
      return { ...prev, records: [...prev.records, newRecord] };
    });
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<RecordItem>) => {
    setState(prev => ({
      ...prev,
      records: prev.records.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      records: prev.records.filter(r => r.id !== id)
    }));
  }, []);

  const moveRecord = useCallback((recordId: string, newCategoryId: string, newOrder: number) => {
    setState(prev => {
      const record = prev.records.find(r => r.id === recordId);
      if (!record) return prev;

      const oldCategoryId = record.categoryId;
      let newRecords = [...prev.records];

      if (oldCategoryId === newCategoryId) {
        // Reorder within same category
        const categoryRecords = newRecords
          .filter(r => r.categoryId === oldCategoryId && r.projectId === record.projectId)
          .sort((a, b) => a.order - b.order);
        
        const oldIndex = categoryRecords.findIndex(r => r.id === recordId);
        const [moved] = categoryRecords.splice(oldIndex, 1);
        categoryRecords.splice(newOrder, 0, moved);

        categoryRecords.forEach((r, i) => {
          const idx = newRecords.findIndex(nr => nr.id === r.id);
          newRecords[idx] = { ...newRecords[idx], order: i };
        });
      } else {
        // Move to different category
        const oldCategoryRecords = newRecords
          .filter(r => r.categoryId === oldCategoryId && r.projectId === record.projectId && r.id !== recordId)
          .sort((a, b) => a.order - b.order);
        
        oldCategoryRecords.forEach((r, i) => {
          const idx = newRecords.findIndex(nr => nr.id === r.id);
          newRecords[idx] = { ...newRecords[idx], order: i };
        });

        const newCategoryRecords = newRecords
          .filter(r => r.categoryId === newCategoryId && r.projectId === record.projectId)
          .sort((a, b) => a.order - b.order);
        
        const movedRecord = { ...record, categoryId: newCategoryId };
        newCategoryRecords.splice(newOrder, 0, movedRecord);

        newCategoryRecords.forEach((r, i) => {
          const idx = newRecords.findIndex(nr => nr.id === r.id);
          if (idx !== -1) {
            newRecords[idx] = { ...r, order: i };
          }
        });
      }

      return { ...prev, records: newRecords };
    });
  }, []);

  const importData = useCallback((data: AppState) => {
    setState(data);
  }, []);

  return {
    state,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addRecord,
    updateRecord,
    deleteRecord,
    moveRecord,
    importData
  };
}
