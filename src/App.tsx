import React, { useState, useRef } from 'react';
import { useStore } from './hooks/useStore';
import { Sidebar } from './components/Sidebar';
import { ProjectView } from './components/ProjectView';
import { RecordModal } from './components/RecordModal';
import { CategoryManager } from './components/CategoryManager';
import { ConfirmModal } from './components/ConfirmModal';
import { QuickAddModal } from './components/QuickAddModal';
import { ProjectLogsModal } from './components/ProjectLogsModal';
import { TodoHierarchyModal } from './components/TodoHierarchyModal';
import { RecordItem } from './types';
import { Settings, Download, Upload, Menu, Plus, Clock, GitMerge } from 'lucide-react';

export default function App() {
  const {
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
    importData,
    deleteLogs
  } = useStore();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    state.projects.length > 0 ? state.projects[0].id : null
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isTodoHierarchyOpen, setIsTodoHierarchyOpen] = useState(false);
  
  const [recordModalState, setRecordModalState] = useState<{
    isOpen: boolean;
    categoryId?: string;
    record?: Partial<RecordItem>;
  }>({ isOpen: false });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = state.projects.find(p => p.id === activeProjectId);
  const projectRecords = state.records.filter(r => r.projectId === activeProjectId);
  const projectCategories = state.categories.filter(c => c.projectId === activeProjectId);
  const projectLogs = state.logs?.filter(l => l.projectId === activeProjectId) || [];

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteProject = (id: string) => {
    confirmAction(
      '删除项目',
      '确定删除该项目吗？相关的所有记录将一并删除，且无法恢复。',
      () => {
        deleteProject(id);
        if (activeProjectId === id) {
          const remainingProjects = state.projects.filter(p => p.id !== id);
          setActiveProjectId(remainingProjects.length > 0 ? remainingProjects[0].id : null);
        }
      }
    );
  };

  const handleDeleteCategory = (id: string) => {
    confirmAction(
      '删除分类',
      '确定删除该分类吗？该分类下的所有记录将一并删除，且无法恢复。',
      () => {
        deleteCategory(id);
      }
    );
  };

  const handleDeleteRecord = (id: string) => {
    confirmAction(
      '删除记录',
      '确定删除此记录吗？删除后无法恢复。',
      () => {
        deleteRecord(id);
      }
    );
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `project_archive_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.projects && data.categories && data.records) {
          importData(data);
          if (data.projects.length > 0) {
            setActiveProjectId(data.projects[0].id);
          }
        } else {
          alert('无效的数据格式');
        }
      } catch (error) {
        alert('解析文件失败');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCheckTodo = (record: RecordItem) => {
    if (record.type === 'todo') {
      updateRecord(record.id, {
        type: record.date ? 'milestone' : 'normal',
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar
        projects={state.projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onAddProject={addProject}
        onUpdateProject={updateProject}
        onDeleteProject={handleDeleteProject}
        onReorderProjects={reorderProjects}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-2 sm:mr-3 p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800 truncate max-w-[100px] sm:max-w-none">工作记录台</h1>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setIsTodoHierarchyOpen(true)}
              className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
              title="待办事项思维导图"
            >
              <GitMerge className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">待办导图</span>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button
              onClick={() => setIsLogsModalOpen(true)}
              className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            >
              <Clock className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">日志</span>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">分类管理</span>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button
              onClick={handleExport}
              className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            >
              <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <Upload className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">导入</span>
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </header>

        {/* Project View */}
        {activeProject ? (
          <ProjectView
            project={activeProject}
            categories={projectCategories}
            records={projectRecords}
            onAddRecord={(categoryId) => setRecordModalState({ isOpen: true, categoryId })}
            onEditRecord={(record) => setRecordModalState({ isOpen: true, record })}
            onCheckTodo={handleCheckTodo}
            onMoveRecord={moveRecord}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="mb-2">请选择或创建一个项目</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsQuickAddOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center z-40 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="快速添加记录"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <RecordModal
        isOpen={recordModalState.isOpen}
        onClose={() => setRecordModalState({ isOpen: false })}
        initialData={recordModalState.record}
        categories={projectCategories}
        defaultCategoryId={recordModalState.categoryId}
        onSave={(recordData) => {
          if (recordModalState.record?.id) {
            updateRecord(recordModalState.record.id, recordData);
          } else if (activeProjectId) {
            addRecord({
              ...recordData,
              projectId: activeProjectId,
              categoryId: recordData.categoryId || recordModalState.categoryId || projectCategories[0]?.id,
            } as any);
          }
        }}
        onDelete={handleDeleteRecord}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        projects={state.projects}
        categories={state.categories}
        activeProjectId={activeProjectId}
        onSave={(recordData) => {
          addRecord(recordData as any);
        }}
      />

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={projectCategories}
        onAdd={(name) => {
          if (activeProjectId) {
            addCategory(name, activeProjectId);
          }
        }}
        onUpdate={updateCategory}
        onDelete={handleDeleteCategory}
        onReorder={reorderCategories}
      />

      <ProjectLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={projectLogs}
        projectName={activeProject?.name || ''}
        onDeleteLogs={deleteLogs}
        onConfirmDelete={(ids, onConfirm) => {
          confirmAction(
            '删除日志',
            `确定要删除选中的 ${ids.length} 条日志吗？`,
            onConfirm
          );
        }}
      />

      {activeProject && (
        <TodoHierarchyModal
          isOpen={isTodoHierarchyOpen}
          onClose={() => setIsTodoHierarchyOpen(false)}
          project={activeProject}
          categories={projectCategories}
          records={projectRecords}
          onAddRecord={(record) => addRecord(record as any)}
          onUpdateRecord={updateRecord}
          onMoveRecord={moveRecord}
        />
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
