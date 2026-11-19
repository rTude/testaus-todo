import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTask,
  escapeHtml,
  generateId,
  loadTasks,
  saveTasks,
  sortTasks,
  statusLabel,
  toggleTaskCompletion,
  updateTask,
} from '../public/taskStore.js';

const STORAGE_KEY = 'todo_tasks_v1';

function makeTask(overrides = {}) {
  return {
    id: 'task-1',
    topic: 'Test task',
    priority: 'medium',
    status: 'todo',
    description: '',
    completed: false,
    createdAt: 100,
    updatedAt: 100,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('taskStore localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads an empty list when no task data exists', () => {
    expect(loadTasks()).toEqual([]);
  });

  it('loads tasks saved under todo_tasks_v1', () => {
    const tasks = [makeTask()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    expect(loadTasks()).toEqual(tasks);
  });

  it('saves tasks under todo_tasks_v1', () => {
    const tasks = [makeTask({ topic: 'Saved task' })];

    saveTasks(tasks);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(tasks);
  });

  it('returns an empty list for invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid');

    expect(loadTasks()).toEqual([]);
  });

  it('returns an empty list for a non-array JSON value', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ topic: 'Not an array' }));

    expect(loadTasks()).toEqual([]);
  });

  it('returns an empty list if localStorage access throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('Storage unavailable');
    });

    expect(loadTasks()).toEqual([]);
  });
});

describe('createTask', () => {
  it('creates a task with all fields and timestamps', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123456);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);

    const task = createTask(
      {
        topic: 'Write unit tests',
        priority: 'high',
        status: 'in-progress',
        description: 'Cover taskStore',
      },
      123456,
    );

    expect(task).toMatchObject({
      topic: 'Write unit tests',
      priority: 'high',
      status: 'in-progress',
      description: 'Cover taskStore',
      completed: false,
      createdAt: 123456,
      updatedAt: 123456,
    });
    expect(task.id).toMatch(/^t_/);

    vi.restoreAllMocks();
  });

  it('marks a task with Done status as completed', () => {
    const task = createTask(
      {
        topic: 'Finished',
        priority: 'low',
        status: 'done',
        description: '',
      },
      200,
    );

    expect(task.completed).toBe(true);
  });

  it('creates an active task for non-Done statuses', () => {
    for (const status of ['todo', 'in-progress', 'blocked']) {
      const task = createTask(
        { topic: status, priority: 'medium', status, description: '' },
        300,
      );
      expect(task.completed).toBe(false);
    }
  });

  it('generateId creates a task-style identifier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.spyOn(Date, 'now').mockReturnValue(123456);

    const id = generateId();

    expect(id).toMatch(/^t_/);
    vi.restoreAllMocks();
  });
});

describe('updateTask', () => {
  it('updates every editable field and timestamp without replacing the id', () => {
    const existing = makeTask();

    const updated = updateTask(
      existing,
      {
        topic: 'Updated',
        priority: 'high',
        status: 'blocked',
        description: 'Updated description',
      },
      500,
    );

    expect(updated).toMatchObject({
      id: 'task-1',
      topic: 'Updated',
      priority: 'high',
      status: 'blocked',
      description: 'Updated description',
      completed: false,
      updatedAt: 500,
    });
  });

  it('marks a task completed when edited status is Done', () => {
    const existing = makeTask({ status: 'in-progress' });

    const updated = updateTask(
      existing,
      {
        topic: 'Finished',
        priority: 'medium',
        status: 'done',
        description: '',
      },
      600,
    );

    expect(updated.completed).toBe(true);
    expect(updated.status).toBe('done');
    expect(updated.previousStatus).toBe('in-progress');
  });

  it('leaves a completed flag unchanged when status changes away from Done', () => {
    const existing = makeTask({
      status: 'done',
      completed: true,
      previousStatus: 'blocked',
    });

    const updated = updateTask(
      existing,
      {
        topic: 'Still complete',
        priority: 'low',
        status: 'blocked',
        description: '',
      },
      700,
    );

    expect(updated.completed).toBe(true);
  });

  it('does not mutate the existing task', () => {
    const existing = makeTask();
    updateTask(
      existing,
      {
        topic: 'Changed',
        priority: 'high',
        status: 'todo',
        description: '',
      },
      800,
    );

    expect(existing.topic).toBe('Test task');
  });
});

describe('toggleTaskCompletion', () => {
  it('completes an active task and sets status to Done', () => {
    const task = makeTask({ status: 'in-progress' });

    const toggled = toggleTaskCompletion(task, 900);

    expect(toggled.completed).toBe(true);
    expect(toggled.status).toBe('done');
    expect(toggled.previousStatus).toBe('in-progress');
    expect(toggled.updatedAt).toBe(900);
  });

  it('undoes a task with Done status to To do', () => {
    const task = makeTask({ status: 'done', completed: true });

    const toggled = toggleTaskCompletion(task, 1000);

    expect(toggled.completed).toBe(false);
    expect(toggled.status).toBe('todo');
  });

  it('undoes a task while preserving the previous non-Done status', () => {
    const task = makeTask({
      status: 'done',
      completed: true,
      previousStatus: 'blocked',
    });

    const toggled = toggleTaskCompletion(task, 1100);

    expect(toggled.completed).toBe(false);
    expect(toggled.status).toBe('blocked');
  });

  it('does not mutate the existing task', () => {
    const task = makeTask({ status: 'todo', completed: false });
    toggleTaskCompletion(task, 1200);

    expect(task.completed).toBe(false);
    expect(task.status).toBe('todo');
  });
});

describe('sortTasks', () => {
  it('puts active tasks before completed tasks', () => {
    const sorted = sortTasks([
      makeTask({ id: 'done', completed: true, status: 'done', createdAt: 500 }),
      makeTask({ id: 'active', completed: false, status: 'todo', createdAt: 100 }),
    ]);

    expect(sorted.map((task) => task.id)).toEqual(['active', 'done']);
  });

  it('orders active tasks by High, Medium, then Low priority', () => {
    const sorted = sortTasks([
      makeTask({ id: 'low', priority: 'low', createdAt: 300 }),
      makeTask({ id: 'medium', priority: 'medium', createdAt: 300 }),
      makeTask({ id: 'high', priority: 'high', createdAt: 300 }),
    ]);

    expect(sorted.map((task) => task.id)).toEqual(['high', 'medium', 'low']);
  });

  it('orders equal-priority tasks newest first', () => {
    const sorted = sortTasks([
      makeTask({ id: 'older', priority: 'medium', createdAt: 100 }),
      makeTask({ id: 'newer', priority: 'medium', createdAt: 200 }),
    ]);

    expect(sorted.map((task) => task.id)).toEqual(['newer', 'older']);
  });

  it('does not mutate the input array', () => {
    const tasks = [
      makeTask({ id: 'low', priority: 'low' }),
      makeTask({ id: 'high', priority: 'high' }),
    ];

    sortTasks(tasks);

    expect(tasks.map((task) => task.id)).toEqual(['low', 'high']);
  });
});

describe('display helpers', () => {
  it('returns readable labels for every known status', () => {
    expect(statusLabel('todo')).toBe('To do');
    expect(statusLabel('in-progress')).toBe('In progress');
    expect(statusLabel('blocked')).toBe('Blocked');
    expect(statusLabel('done')).toBe('Done');
  });

  it('returns an unknown status unchanged', () => {
    expect(statusLabel('review')).toBe('review');
  });

  it('escapes HTML special characters for safe rendering', () => {
    expect(escapeHtml('<img src="x" onerror=\'alert(1)\'> & text')).toBe(
      '&lt;img src=&quot;x&quot; onerror=&#039;alert(1)&#039;&gt; &amp; text',
    );
  });

  it('returns a string value from escapeHtml', () => {
    expect(escapeHtml(null)).toBe('null');
  });
});
