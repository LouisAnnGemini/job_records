import React from 'react';
import { Category, RecordItem } from '../types';
import { RecordCard } from './RecordCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

interface CategoryColumnProps {
  key?: React.Key;
  category: Category;
  records: RecordItem[];
  onAddRecord: (categoryId: string) => void;
  onEditRecord: (record: RecordItem) => void;
  onCheckTodo: (record: RecordItem) => void;
}

export function CategoryColumn({
  category,
  records,
  onAddRecord,
  onEditRecord,
  onCheckTodo,
}: CategoryColumnProps) {
  const { setNodeRef } = useDroppable({
    id: category.id,
    data: {
      type: 'Category',
      category,
    },
  });

  return (
    <div className="flex flex-col bg-gray-50 rounded-lg w-80 flex-shrink-0">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-100 rounded-t-lg">
        <h3 className="font-semibold text-gray-700">{category.name}</h3>
        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
          {records.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-2 overflow-y-auto min-h-[200px]"
      >
        <SortableContext
          items={records.map(r => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {records.map(record => (
            <RecordCard
              key={record.id}
              record={record}
              onClick={() => onEditRecord(record)}
              onCheck={() => onCheckTodo(record)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={() => onAddRecord(category.id)}
          className="w-full flex items-center justify-center py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          添加记录
        </button>
      </div>
    </div>
  );
}
