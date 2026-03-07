'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: number;
  created_at: string;
  updated_at: string;
};

type KanbanColumnProps = {
  id: 'todo' | 'in_progress' | 'done';
  title: string;
  tasks: Task[];
  onDeleteTask: (id: number) => void;
};

const columnColors = {
  todo: 'bg-slate-100 border-slate-200',
  in_progress: 'bg-blue-50 border-blue-200',
  done: 'bg-green-50 border-green-200',
};

const headerColors = {
  todo: 'text-slate-700',
  in_progress: 'text-blue-700',
  done: 'text-green-700',
};

export function KanbanColumn({ id, title, tasks, onDeleteTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 ${columnColors[id]} ${
        isOver ? 'border-dashed border-blue-400 bg-blue-50/50' : ''
      } min-h-[500px] p-4`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`font-bold text-lg ${headerColors[id]}`}>{title}</h2>
        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-slate-600">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
