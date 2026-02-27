import React, { useState, useMemo, useEffect } from 'react';
import { ProjectLog } from '../types';
import { X, Clock, Trash2, Copy, Filter, Calendar } from 'lucide-react';

interface ProjectLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ProjectLog[];
  projectName: string;
  onDeleteLogs: (logIds: string[]) => void;
}

export function ProjectLogsModal({ isOpen, onClose, logs, projectName, onDeleteLogs }: ProjectLogsModalProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFilterType('all');
      setStartDate('');
      setEndDate('');
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter by type
      if (filterType !== 'all' && !log.content.startsWith(filterType)) {
        return false;
      }
      
      // Filter by date
      if (startDate || endDate) {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (logDate > end) return false;
        }
      }
      
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, filterType, startDate, endDate]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map(l => l.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`确定要删除选中的 ${selectedIds.size} 条日志吗？`)) {
      onDeleteLogs(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleCopySelected = () => {
    if (selectedIds.size === 0) return;
    const logsToCopy = filteredLogs
      .filter(l => selectedIds.has(l.id))
      .map(l => `[${new Date(l.timestamp).toLocaleString()}] ${l.content}`)
      .join('\n');
      
    navigator.clipboard.writeText(logsToCopy).then(() => {
      alert('已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败', err);
      alert('复制失败，请手动复制');
    });
  };

  const logTypes = ['增加项目', '增加记录', '增加里程碑', '完成待办任务', '删除记录'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500" />
            {projectName} - 项目日志
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">所有操作类型</option>
                {logTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-500 text-sm">至</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="selectAll"
                checked={filteredLogs.length > 0 && selectedIds.size === filteredLogs.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700 cursor-pointer">
                全选 ({selectedIds.size}/{filteredLogs.length})
              </label>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={handleCopySelected}
                disabled={selectedIds.size === 0}
                className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedIds.size > 0 
                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
                    : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Copy className="w-4 h-4 mr-1.5" />
                复制
              </button>
              <button 
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedIds.size > 0 
                    ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100' 
                    : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                删除
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              没有找到符合条件的日志
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => (
                <div 
                  key={log.id} 
                  className={`p-3 rounded-lg border shadow-sm flex items-start transition-colors cursor-pointer ${
                    selectedIds.has(log.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleToggleSelect(log.id)}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(log.id)}
                    onChange={() => {}} // Handled by div click
                    className="mt-1 mr-3 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{log.content}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
