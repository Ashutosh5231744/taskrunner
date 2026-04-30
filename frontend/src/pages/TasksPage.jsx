import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const columns = [
  { key: "todo", label: "Todo", header: "bg-orange-100 text-orange-700 border-orange-200" },
  {
    key: "in-progress",
    label: "In Progress",
    header: "bg-violet-100 text-violet-700 border-violet-200",
  },
  { key: "done", label: "Done", header: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

const getInitials = (name = "U") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const getPriority = (task) => {
  if (!task.dueDate) return "Low";
  const days = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return "High";
  if (days <= 7) return "Medium";
  return "Low";
};

const priorityStyles = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [filters, setFilters] = useState({
    project: "",
    assignee: "",
    priority: "",
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project: "",
    assignedTo: "",
    dueDate: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([api.get("/tasks"), api.get("/projects")]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProject = projects.find((project) => project._id === newTask.project);

  const onCreateTask = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/tasks", newTask);
      setNewTask({
        title: "",
        description: "",
        project: "",
        assignedTo: "",
        dueDate: "",
      });
      setShowCreate(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const onStatusChange = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const priority = getPriority(task);
      const projectOk = !filters.project || task.project?._id === filters.project;
      const assigneeOk = !filters.assignee || task.assignedTo?._id === filters.assignee;
      const priorityOk = !filters.priority || priority === filters.priority;
      return projectOk && assigneeOk && priorityOk;
    });
  }, [filters, tasks]);

  const assignees = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (task.assignedTo?._id && !map.has(task.assignedTo._id)) {
        map.set(task.assignedTo._id, task.assignedTo);
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const tasksByColumn = useMemo(() => {
    return {
      todo: filteredTasks.filter((task) => task.status === "todo"),
      "in-progress": filteredTasks.filter((task) => task.status === "in-progress"),
      done: filteredTasks.filter((task) => task.status === "done"),
    };
  }, [filteredTasks]);

  const onDropToColumn = async (status) => {
    if (!draggingTaskId) return;
    const draggedTask = tasks.find((task) => task._id === draggingTaskId);
    if (!draggedTask || draggedTask.status === status) return;
    await onStatusChange(draggingTaskId, status);
    setDraggingTaskId("");
  };

  if (loading) return <p className="rounded-lg bg-white p-4">Loading tasks...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tasks</h2>
          <p className="text-sm text-slate-500">Kanban workflow, filters, and assignment tracking</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Task
        </button>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {showCreate && (
        <form onSubmit={onCreateTask} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Create Task</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />

            <select
              value={newTask.project}
              onChange={(e) =>
                setNewTask((prev) => ({
                  ...prev,
                  project: e.target.value,
                  assignedTo: "",
                }))
              }
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              required
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </select>

            <select
              value={newTask.assignedTo}
              onChange={(e) => setNewTask((prev) => ({ ...prev, assignedTo: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              required
              disabled={!selectedProject}
            >
              <option value="">Assign member</option>
              {selectedProject?.members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Task
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Filters</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={filters.project}
            onChange={(e) => setFilters((prev) => ({ ...prev, project: e.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>
          <select
            value={filters.assignee}
            onChange={(e) => setFilters((prev) => ({ ...prev, assignee: e.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">All assignees</option>
            {assignees.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {columns.map((column) => (
          <div
            key={column.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropToColumn(column.key)}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div
              className={`mb-3 rounded-xl border px-3 py-2 text-sm font-semibold ${column.header}`}
            >
              {column.label} ({tasksByColumn[column.key].length})
            </div>

            <div className="space-y-3">
              {tasksByColumn[column.key].length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  No tasks in {column.label}
                </div>
              ) : (
                tasksByColumn[column.key].map((task) => {
                  const priority = getPriority(task);
                  return (
                    <article
                      key={task._id}
                      draggable
                      onDragStart={() => setDraggingTaskId(task._id)}
                      className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-900">{task.title}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[priority]}`}>
                          {priority}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{task.project?.title || "No Project"}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white">
                            {getInitials(task.assignedTo?.name)}
                          </span>
                          <span className="text-sm text-slate-700">{task.assignedTo?.name || "-"}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                        </span>
                      </div>
                      <div className="mt-3">
                        <label className="text-xs text-slate-500">Move quickly</label>
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task._id, e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                        >
                          <option value="todo">Todo</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default TasksPage;
