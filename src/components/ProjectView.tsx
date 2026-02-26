import React, { useState } from 'react';
import { Project, Category, RecordItem } from '../types';
import { CategoryColumn } from './CategoryColumn';
import { RecordCard } from './RecordCard';
import {
  DndContext,
  closestCenter,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Flag, CheckSquare, Maximize2, Minimize2, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';

interface ProjectViewProps {
  project: Project;
  categories: Category[];
  records: RecordItem[];
  onAddRecord: (categoryId: string) => void;
  onEditRecord: (record: RecordItem) => void;
  onCheckTodo: (record: RecordItem) => void;
  onMoveRecord: (recordId: string, newCategoryId: string, newOrder: number) => void;
}

export function ProjectView({
  project,
  categories,
  records,
  onAddRecord,
  onEditRecord,
  onCheckTodo,
  onMoveRecord,
}: ProjectViewProps) {
  const [activeRecord, setActiveRecord] = useState<RecordItem | null>(null);
  const [expandedSection, setExpandedSection] = useState<'milestones' | 'todos' | 'kanban' | null>(null);
  const [showOverview, setShowOverview] = useState(() => window.innerWidth >= 768);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const record = records.find(r => r.id === active.id);
    if (record) {
      setActiveRecord(record);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeRecord = records.find(r => r.id === activeId);
    const overRecord = records.find(r => r.id === overId);
    const overCategory = categories.find(c => c.id === overId);

    if (!activeRecord) return;

    if (overRecord && activeRecord.categoryId !== overRecord.categoryId) {
      const newCategoryId = overRecord.categoryId;
      const categoryRecords = records
        .filter(r => r.categoryId === newCategoryId)
        .sort((a, b) => a.order - b.order);
      
      const overIndex = categoryRecords.findIndex(r => r.id === overId);
      
      // Move to the new category at the hovered index
      onMoveRecord(activeId, newCategoryId, overIndex);
    } else if (overCategory && activeRecord.categoryId !== overCategory.id) {
      const newCategoryId = overCategory.id;
      const categoryRecords = records.filter(r => r.categoryId === newCategoryId);
      // Move to the empty category
      onMoveRecord(activeId, newCategoryId, categoryRecords.length);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveRecord(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeRecord = records.find(r => r.id === activeId);
    const overRecord = records.find(r => r.id === overId);
    const overCategory = categories.find(c => c.id === overId);

    if (activeRecord && overRecord && activeRecord.categoryId === overRecord.categoryId) {
      const categoryId = activeRecord.categoryId;
      const categoryRecords = records
        .filter(r => r.categoryId === categoryId)
        .sort((a, b) => a.order - b.order);
      
      const activeIndex = categoryRecords.findIndex(r => r.id === activeId);
      const overIndex = categoryRecords.findIndex(r => r.id === overId);
      
      if (activeIndex !== overIndex) {
        onMoveRecord(activeId, categoryId, overIndex);
      }
    } else if (activeRecord && overCategory && activeRecord.categoryId === overCategory.id) {
      // Dropped on the empty space of the SAME category
      const categoryId = activeRecord.categoryId;
      const categoryRecords = records
        .filter(r => r.categoryId === categoryId)
        .sort((a, b) => a.order - b.order);
      
      const activeIndex = categoryRecords.findIndex(r => r.id === activeId);
      const overIndex = categoryRecords.length - 1; // Move to the end
      
      if (activeIndex !== overIndex) {
        onMoveRecord(activeId, categoryId, overIndex);
      }
    }
  };

  const milestones = records
    .filter(r => r.type === 'milestone')
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  
  const todos = records
    .filter(r => r.type === 'todo')
    .sort((a, b) => {
      if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return a.order - b.order;
    });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top Header for Project Name */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <h1 className="text-lg font-bold text-gray-900 truncate pr-4">{project.name}</h1>
        <div className="flex items-center space-x-2 shrink-0">
          {expandedSection === null && (
            <button
              onClick={() => setShowOverview(!showOverview)}
              className="text-xs flex items-center text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            >
              {showOverview ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
              {showOverview ? '收起概览' : '展开概览'}
            </button>
          )}
          {expandedSection !== null && (
            <button onClick={() => setExpandedSection(null)} className="text-xs flex items-center text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors">
              <Minimize2 className="w-3.5 h-3.5 mr-1" /> 退出全屏
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Section (Milestones & Todos) */}
        {expandedSection !== 'kanban' && showOverview && (
          <div className={`p-4 bg-white border-b border-gray-200 ${expandedSection ? 'flex-1 overflow-hidden' : 'shrink-0'}`}>
            <div className={`grid gap-4 h-full ${expandedSection ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              
              {/* Milestones Area */}
              {(expandedSection === null || expandedSection === 'milestones') && (
                <div className={`bg-red-50 rounded-xl p-3 border border-red-100 shadow-sm flex flex-col ${expandedSection === 'milestones' ? 'h-full' : ''}`}>
                  <div className="flex items-center justify-between mb-2 text-red-700 shrink-0">
                    <div className="flex items-center">
                      <Flag className="w-4 h-4 mr-1.5" />
                      <h2 className="font-semibold text-sm">项目里程碑</h2>
                    </div>
                    <button onClick={() => setExpandedSection(expandedSection === 'milestones' ? null : 'milestones')} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors">
                      {expandedSection === 'milestones' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className={`space-y-2 overflow-y-auto pr-2 ${expandedSection === 'milestones' ? 'flex-1' : 'max-h-32'}`}>
                    {milestones.length === 0 ? (
                      <p className="text-xs text-red-400 italic">暂无里程碑记录</p>
                    ) : (
                      milestones.map(m => (
                        <div
                          key={m.id}
                          onClick={() => onEditRecord(m)}
                          className="bg-white p-2 rounded-md border border-red-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center"
                        >
                          <span className="text-xs font-medium text-gray-800">{m.title}</span>
                          <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                            {m.date}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* To-Do Area */}
              {(expandedSection === null || expandedSection === 'todos') && (
                <div className={`bg-blue-50 rounded-xl p-3 border border-blue-100 shadow-sm flex flex-col ${expandedSection === 'todos' ? 'h-full' : ''}`}>
                  <div className="flex items-center justify-between mb-2 text-blue-700 shrink-0">
                    <div className="flex items-center">
                      <CheckSquare className="w-4 h-4 mr-1.5" />
                      <h2 className="font-semibold text-sm">待办事项</h2>
                    </div>
                    <button onClick={() => setExpandedSection(expandedSection === 'todos' ? null : 'todos')} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-100 transition-colors">
                      {expandedSection === 'todos' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className={`space-y-2 overflow-y-auto pr-2 ${expandedSection === 'todos' ? 'flex-1' : 'max-h-32'}`}>
                    {todos.length === 0 ? (
                      <p className="text-xs text-blue-400 italic">暂无待办事项</p>
                    ) : (
                      todos.map(t => (
                        <div
                          key={t.id}
                          onClick={() => onEditRecord(t)}
                          className="bg-white p-2 rounded-md border border-blue-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckTodo(t);
                              }}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-medium text-gray-800">{t.title}</span>
                          </div>
                          {t.date && (
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                              {t.date}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kanban Area */}
        {(expandedSection === null || expandedSection === 'kanban') && (
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {expandedSection === null && (
               <div className="px-4 py-2 flex justify-between items-center border-b border-gray-200 bg-white shrink-0">
                 <div className="flex items-center text-gray-600">
                   <LayoutDashboard className="w-4 h-4 mr-1.5" />
                   <h2 className="font-semibold text-sm">看板视图</h2>
                 </div>
                 <button onClick={() => setExpandedSection('kanban')} className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors">
                   <Maximize2 className="w-3.5 h-3.5" />
                 </button>
               </div>
            )}
            <div className="flex-1 overflow-x-auto p-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="flex space-x-4 h-full">
                  {categories.sort((a, b) => a.order - b.order).map(category => (
                    <CategoryColumn
                      key={category.id}
                      category={category}
                      records={records
                        .filter(r => r.categoryId === category.id)
                        .sort((a, b) => a.order - b.order)}
                      onAddRecord={onAddRecord}
                      onEditRecord={onEditRecord}
                      onCheckTodo={onCheckTodo}
                    />
                  ))}
                </div>
                
                <DragOverlay>
                  {activeRecord ? (
                    <RecordCard
                      record={activeRecord}
                      onClick={() => {}}
                      isOverlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
