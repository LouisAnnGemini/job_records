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
import { Flag, CheckSquare } from 'lucide-react';

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
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{project.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Milestones Area */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 shadow-sm">
            <div className="flex items-center mb-3 text-red-700">
              <Flag className="w-5 h-5 mr-2" />
              <h2 className="font-semibold text-lg">项目里程碑</h2>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {milestones.length === 0 ? (
                <p className="text-sm text-red-400 italic">暂无里程碑记录</p>
              ) : (
                milestones.map(m => (
                  <div
                    key={m.id}
                    onClick={() => onEditRecord(m)}
                    className="bg-white p-3 rounded-lg border border-red-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">{m.title}</span>
                    <span className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      {m.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* To-Do Area */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center mb-3 text-blue-700">
              <CheckSquare className="w-5 h-5 mr-2" />
              <h2 className="font-semibold text-lg">待办事项</h2>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {todos.length === 0 ? (
                <p className="text-sm text-blue-400 italic">暂无待办事项</p>
              ) : (
                todos.map(t => (
                  <div
                    key={t.id}
                    onClick={() => onEditRecord(t)}
                    className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckTodo(t);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <CheckSquare className="w-5 h-5" />
                      </button>
                      <span className="font-medium text-gray-800">{t.title}</span>
                    </div>
                    {t.date && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {t.date}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
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
  );
}
