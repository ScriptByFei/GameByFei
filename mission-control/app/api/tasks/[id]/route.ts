import { NextResponse } from 'next/server';
import { updateTask, deleteTask } from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const updates: { title?: string; description?: string; status?: 'todo' | 'in_progress' | 'done'; priority?: number } = {};
    
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) {
      if (!['todo', 'in_progress', 'done'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: todo, in_progress, or done' },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }
    if (body.priority !== undefined) {
      updates.priority = body.priority;
    }
    
    const task = updateTask(id, updates);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    const success = deleteTask(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
