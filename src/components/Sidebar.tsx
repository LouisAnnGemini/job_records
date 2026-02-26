import React, { useState } from 'react';
import { Project } from '../types';
import { cn } from '../utils';
import { Folder, Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string) => void;
  onUpdateProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onReorderProjects: (projects: Project[]) => void;
}

function SortableProjectItem({
  project,
  isActive,
  onSelect,
  onUpdate,
  onDelete,
}: {
  key?: React.Key;
  project: Project;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);

  const handleSave = () => {
    if (editName.trim()) {
      onUpdate(project.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer mb-1',
        isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center flex-1 min-w-0" {...attributes} {...listeners}>
        <Folder className={cn('w-4 h-4 mr-2 flex-shrink-0', isActive ? 'text-blue-500' : 'text-gray-400')} />
        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setEditName(project.name);
                setIsEditing(false);
              }
            }}
            className="flex-1 bg-white border border-blue-300 rounded px-1 text-sm outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-sm font-medium">{project.name}</span>
        )}
      </div>
      
      {!isEditing && (
        <div className="hidden group-hover:flex items-center space-x-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onReorderProjects,
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      
      const newProjects = arrayMove(projects, oldIndex, newIndex).map((p, i) => ({ ...p, order: i }));
      onReorderProjects(newProjects);
    }
  };

  const handleAdd = () => {
    if (newName.trim()) {
      onAddProject(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">项目档案</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isAdding && (
          <div className="px-3 py-2 mb-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => {
                if (!newName.trim()) setIsAdding(false);
                else handleAdd();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') {
                  setNewName('');
                  setIsAdding(false);
                }
              }}
              placeholder="新项目名称..."
              className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-sm outline-none"
            />
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {projects.sort((a, b) => a.order - b.order).map((project) => (
              <SortableProjectItem
                key={project.id}
                project={project}
                isActive={activeProjectId === project.id}
                onSelect={() => onSelectProject(project.id)}
                onUpdate={onUpdateProject}
                onDelete={onDeleteProject}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
