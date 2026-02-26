import React from 'react';
import { RecordItem } from '../types';
import { cn } from '../utils';
import { Calendar, CheckSquare, Flag, MoreHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RecordCardProps {
  key?: React.Key;
  record: RecordItem;
  onClick: () => void;
  onCheck?: (checked: boolean) => void;
  isOverlay?: boolean;
}

export function RecordCard({ record, onClick, onCheck, isOverlay }: RecordCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id, data: { type: 'Record', record } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isMilestone = record.type === 'milestone';
  const isTodo = record.type === 'todo';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-white p-3 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing mb-2 hover:shadow-md transition-shadow',
        isMilestone ? 'border-red-200 border-l-4 border-l-red-500' : 
        isTodo ? 'border-blue-200 border-l-4 border-l-blue-500' : 'border-gray-200',
        isOverlay && 'shadow-xl rotate-2 scale-105 cursor-grabbing'
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {isTodo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCheck?.(true);
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          )}
          {isMilestone && <Flag className="w-4 h-4 text-red-500 flex-shrink-0" />}
          <h4 className="font-medium text-gray-900 text-sm truncate">{record.title}</h4>
        </div>
      </div>
      
      {record.content && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{record.content}</p>
      )}

      {record.date && (
        <div className={cn(
          "flex items-center text-xs mt-2",
          isMilestone ? "text-red-600 font-medium" : "text-gray-400"
        )}>
          <Calendar className="w-3 h-3 mr-1" />
          {record.date}
        </div>
      )}
    </div>
  );
}
