'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical } from 'lucide-react';

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: number;
  created_at: string;
  updated_at: string;
};

type TaskCardProps = {
  task: Task;
  onDelete: () => void;
  isOverlay?: boolean;
};

const priorityColors = {
  1: 'bg-gray-100 text-gray-700 border-gray-200', // Low
  2: 'bg-blue-100 text-blue-700 border-blue-200', // Normal
  3: 'bg-orange-100 text-orange-700 border-orange-200', // High
  4: 'bg-red-100 text-red-700 border-red-200', // Urgent
};

const priorityLabels = {
  1: 'Low',
  2: 'Normal',
  3: 'High',
  4: 'Urgent',
};

export function TaskCard({ task, onDelete, isOverlay = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      } ${isOverlay ? 'shadow-xl rotate-2 scale-105' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div className="text-slate-400 mt-0.5 cursor-grab">
          <GripVertical size={16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 mb-1 truncate">{task.title}</h3>
          {task.description && (
            <p className="text-slate-500 text-sm mb-2 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                priorityColors[task.priority as keyof typeof priorityColors]
              }`}
            >
              {priorityLabels[task.priority as keyof typeof priorityLabels]}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
