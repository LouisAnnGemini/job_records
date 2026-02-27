import React, { useState, useEffect } from 'react';
import { RecordItem, RecordType, Category, Project } from '../types';
import { X } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<RecordItem>) => void;
  projects: Project[];
  categories: Category[];
  activeProjectId: string | null;
}

export function QuickAddModal({ isOpen, onClose, onSave, projects, categories, activeProjectId }: QuickAddModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<RecordType>('normal');
  const [date, setDate] = useState('');
  
  const [projectId, setProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Update selected project when modal opens or active project changes
  useEffect(() => {
    if (isOpen) {
      const defaultProject = activeProjectId || (projects.length > 0 ? projects[0].id : '');
      setProjectId(defaultProject);
      
      // Reset other fields
      setTitle('');
      setContent('');
      setType('normal');
      setDate('');
    }
  }, [isOpen, activeProjectId, projects]);

  // Update available categories when selected project changes
  const projectCategories = categories.filter(c => c.projectId === projectId);
  
  useEffect(() => {
    if (isOpen && projectCategories.length > 0) {
      // If current categoryId is not in the new project's categories, reset it
      if (!projectCategories.find(c => c.id === categoryId)) {
        setCategoryId(projectCategories[0].id);
      }
    } else if (isOpen) {
      setCategoryId('');
    }
  }, [projectId, projectCategories, isOpen, categoryId]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!projectId) {
      alert('请选择项目');
      return;
    }

    if (!title.trim()) {
      alert('请输入标题');
      return;
    }

    if (type === 'milestone' && !date) {
      alert('里程碑必须填写日期');
      return;
    }

    if (!categoryId) {
      alert('请选择分类');
      return;
    }

    onSave({
      projectId,
      title: title.trim(),
      content: content.trim(),
      type,
      date: date || undefined,
      categoryId,
    });
    
    // Reset only title and content for batch adding
    setTitle('');
    setContent('');
    // Keep projectId, categoryId, type, and date as is
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">快速添加记录</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属项目 <span className="text-red-500">*</span></label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属分类 <span className="text-red-500">*</span></label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={projectCategories.length === 0}
              >
                {projectCategories.length === 0 ? (
                  <option value="">无分类</option>
                ) : (
                  projectCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="记录标题 (按回车快速保存)"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="详细内容..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="normal"
                  checked={type === 'normal'}
                  onChange={() => setType('normal')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">普通记录</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="todo"
                  checked={type === 'todo'}
                  onChange={() => setType('todo')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">待办任务</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="milestone"
                  checked={type === 'milestone'}
                  onChange={() => setType('milestone')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">里程碑</span>
              </label>
            </div>
          </div>

          {(type === 'milestone' || type === 'todo') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'milestone' ? '日期 (必填)' : '截止日期 (选填)'}
                {type === 'milestone' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end items-center bg-gray-50 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
