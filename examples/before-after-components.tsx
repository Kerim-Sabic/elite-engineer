// ============================================================
// BEFORE: The Mega-Component
// 200+ lines, mixed concerns, prop drilling, useEffect abuse,
// inline styles, no loading/error states
// ============================================================

import { useState, useEffect } from 'react';

function ProjectDashboard({ userId, projectId, theme, onLogout }: {
  userId: string;
  projectId: string;
  theme: 'light' | 'dark';
  onLogout: () => void;
}) {
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/members`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/tasks`).then(r => r.json()),
    ]).then(([p, m, t]) => {
      setProject(p);
      setMembers(m);
      setTasks(t);
      setIsLoading(false);
    });
  }, [projectId]);

  // ❌ State synchronization trap — derived state via useEffect
  useEffect(() => {
    let result = tasks;
    if (filter !== 'all') result = result.filter((t: any) => t.status === filter);
    if (searchQuery) result = result.filter((t: any) => t.title.includes(searchQuery));
    if (sortBy === 'date') result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredTasks(result);
  }, [tasks, filter, searchQuery, sortBy]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', background: theme === 'dark' ? '#1a1a1a' : '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px' }}>{project?.name}</h1>
        <button onClick={onLogout}>Logout</button>
      </header>

      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          style={{ padding: '8px', border: '1px solid #ccc' }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date">Date</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* 100 more lines of inline rendering, prop drilling, etc. */}

      <div>
        {filteredTasks.map((task: any) => (
          <div key={task.id} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
            <h3>{task.title}</h3>
            <span>{task.status}</span>
            <span>{task.assignee}</span>
          </div>
        ))}
      </div>

      <aside>
        <h2>Team ({members.length})</h2>
        {members.map((m: any) => (
          <div key={m.id}>{m.name}</div>
        ))}
      </aside>
    </div>
  );
}


// ============================================================
// AFTER: Composed architecture with elite-engineer rules
// Vertical slice, deep hooks, derived state, Suspense,
// design system components, type-safe throughout
// ============================================================

// --- features/projects/types.ts ---
import { z } from 'zod';

type Brand<T, B extends string> = T & { readonly __brand: B };
type ProjectId = Brand<string, 'ProjectId'>;

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['todo', 'in-progress', 'done']),
  assigneeId: z.string(),
  priority: z.number(),
  createdAt: z.string().datetime(),
});
type Task = z.infer<typeof TaskSchema>;

type TaskFilter = Task['status'] | 'all';
type SortField = 'date' | 'priority';


// --- features/projects/hooks/use-project-dashboard.ts ---
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

function projectOptions(id: ProjectId) {
  return queryOptions({
    queryKey: ['projects', id] as const,
    queryFn: () => fetchProject(id),
  });
}

function projectMembersOptions(id: ProjectId) {
  return queryOptions({
    queryKey: ['projects', id, 'members'] as const,
    queryFn: () => fetchMembers(id),
  });
}

function projectTasksOptions(id: ProjectId) {
  return queryOptions({
    queryKey: ['projects', id, 'tasks'] as const,
    queryFn: () => fetchTasks(id),
  });
}

// Deep hook: simple interface, rich implementation
function useProjectDashboard(projectId: ProjectId) {
  const { data: project } = useSuspenseQuery(projectOptions(projectId));
  const { data: members } = useSuspenseQuery(projectMembersOptions(projectId));
  const { data: tasks } = useSuspenseQuery(projectTasksOptions(projectId));

  return { project, members, tasks } as const;
}


// --- features/projects/hooks/use-task-filters.ts ---
// URL state for shareability + browser back/forward

function useTaskFilters() {
  const [filter, setFilter] = useURLState<TaskFilter>('filter', 'all');
  const [sortBy, setSortBy] = useURLState<SortField>('sort', 'date');
  const [search, setSearch] = useURLState('q', '');

  return { filter, setFilter, sortBy, setSortBy, search, setSearch } as const;
}

// Derived — computed during render. No useEffect, no extra state.
function useFilteredTasks(tasks: Task[], filter: TaskFilter, search: string, sortBy: SortField) {
  return useMemo(() => {
    let result = tasks;
    if (filter !== 'all') result = result.filter(t => t.status === filter);
    if (search) result = result.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

    const SORT_FNS: Record<SortField, (a: Task, b: Task) => number> = {
      date: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      priority: (a, b) => b.priority - a.priority,
    };
    return [...result].sort(SORT_FNS[sortBy]);
  }, [tasks, filter, search, sortBy]);
}


// --- features/projects/components/task-list.tsx ---
function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle />}
        title="No tasks match your filters"
        description="Try adjusting your search or filter criteria."
        action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tasks.map(task => (
        <TaskRow key={task.id} task={task} />
      ))}
    </ul>
  );
}


// --- features/projects/components/task-filters.tsx ---
function TaskFilters() {
  const { filter, setFilter, sortBy, setSortBy, search, setSearch } = useTaskFilters();

  return (
    <div className="flex items-center gap-2">
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search tasks..."
        className="w-64"
      />
      <Select value={filter} onValueChange={setFilter}>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="todo">Todo</SelectItem>
        <SelectItem value="in-progress">In Progress</SelectItem>
        <SelectItem value="done">Done</SelectItem>
      </Select>
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectItem value="date">Date</SelectItem>
        <SelectItem value="priority">Priority</SelectItem>
      </Select>
    </div>
  );
}


// --- app/(auth)/projects/[id]/page.tsx --- (thin orchestrator)
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const projectId = ProjectId(params.id);

  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <Suspense fallback={<DashboardSkeleton />}>
        <ProjectDashboardContent projectId={projectId} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Content component — uses the deep hook, renders composed pieces
function ProjectDashboardContent({ projectId }: { projectId: ProjectId }) {
  const { project, members, tasks } = useProjectDashboard(projectId);
  const { filter, search, sortBy } = useTaskFilters();
  const filteredTasks = useFilteredTasks(tasks, filter, search, sortBy);

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">{project.name}</h1>
        <TeamAvatars members={members} />
      </header>
      <TaskFilters />
      <TaskList tasks={filteredTasks} />
    </div>
  );
}
