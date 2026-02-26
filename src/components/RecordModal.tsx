import React, { useState, useEffect } from 'react';
import { RecordItem, RecordType, Category } from '../types';
import { X } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<RecordItem>) => void;
  onDelete?: (id: string) => void;
  initialData?: Partial<RecordItem>;
  categories: Category[];
  defaultCategoryId?: string;
}

export function RecordModal({ isOpen, onClose, onSave, onDelete, initialData, categories, defaultCategoryId }: RecordModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<RecordType>('normal');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setContent(initialData?.content || '');
      setType(initialData?.type || 'normal');
      setDate(initialData?.date || '');
      setCategoryId(initialData?.categoryId || defaultCategoryId || (categories.length > 0 ? categories[0].id : ''));
    }
  }, [isOpen, initialData, defaultCategoryId, categories]);

  if (!isOpen) return null;

  const handleSave = () => {
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
      title: title.trim(),
      content: content.trim(),
      type,
      date: date || undefined,
      categoryId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {initialData?.id ? '编辑记录' : '添加记录'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="记录标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属分类 <span className="text-red-500">*</span></label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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

        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          {initialData?.id && onDelete ? (
            <button
              onClick={() => {
                onDelete(initialData.id!);
                onClose();
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2"
            >
              删除
            </button>
          ) : (
            <div></div>
          )}
          <div className="flex space-x-3">
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
    </div>
  );
}
