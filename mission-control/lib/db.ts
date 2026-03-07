import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'mission-control.sqlite');

export const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
    priority INTEGER CHECK(priority IN (1, 2, 3, 4)) DEFAULT 2,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 1 | 2 | 3 | 4;
  created_at: string;
  updated_at: string;
};

export function getAllTasks(): Task[] {
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as Task[];
}

export function createTask(title: string, description?: string, priority: 1 | 2 | 3 | 4 = 2): Task {
  const result = db.prepare(
    'INSERT INTO tasks (title, description, priority) VALUES (?, ?, ?)'
  ).run(title, description || null, priority);
  
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;
}

export function updateTask(id: number, updates: { title?: string; description?: string | null; status?: 'todo' | 'in_progress' | 'done'; priority?: number }): Task | null {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return null;
  
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (updates.title) {
    sets.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    sets.push('description = ?');
    values.push(updates.description);
  }
  if (updates.status) {
    sets.push('status = ?');
    values.push(updates.status);
  }
  if (updates.priority !== undefined) {
    sets.push('priority = ?');
    values.push(updates.priority);
  }
  
  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
}

export function deleteTask(id: number): boolean {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}
