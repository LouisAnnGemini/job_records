import React from 'react';
import { ProjectLog } from '../types';
import { X, Clock } from 'lucide-react';

interface ProjectLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ProjectLog[];
  projectName: string;
}

export function ProjectLogsModal({ isOpen, onClose, logs, projectName }: ProjectLogsModalProps) {
  if (!isOpen) return null;

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500" />
            {projectName} - 项目日志
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          {sortedLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无日志记录
            </div>
          ) : (
            <div className="space-y-3">
              {sortedLogs.map(log => (
                <div key={log.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-800">{log.content}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(log.timestamp).toLocaleString()}
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
