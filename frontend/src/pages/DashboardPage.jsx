import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const statusStyles = {
  todo: "bg-amber-100 text-amber-700 ring-amber-200",
  "in-progress": "bg-violet-100 text-violet-700 ring-violet-200",
  done: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const statusLabel = {
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
};

const getUserInitials = (name = "U") => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/tasks");
        setTasks(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => task.dueDate && new Date(task.dueDate) < now && task.status !== "done");
  }, [tasks]);

  const statusSummary = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      { todo: 0, "in-progress": 0, done: 0 }
    );
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((statusSummary.done / tasks.length) * 100);
  }, [statusSummary.done, tasks.length]);

  const progressSegments = useMemo(() => {
    if (!tasks.length) {
      return { todo: 0, "in-progress": 0, done: 0 };
    }
    return {
      todo: Math.round((statusSummary.todo / tasks.length) * 100),
      "in-progress": Math.round((statusSummary["in-progress"] / tasks.length) * 100),
      done: Math.round((statusSummary.done / tasks.length) * 100),
    };
  }, [statusSummary, tasks.length]);

  const statCards = [
    {
      label: "Total Tasks",
      value: tasks.length,
      gradient: "from-blue-500 to-sky-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      ),
    },
    {
      label: "Todo",
      value: statusSummary.todo,
      gradient: "from-amber-500 to-orange-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M12 8v5l3 3" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
    },
    {
      label: "In Progress",
      value: statusSummary["in-progress"],
      gradient: "from-violet-500 to-purple-500",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M7 17 17 7" />
          <path d="M7 7h10v10" />
        </svg>
      ),
    },
    {
      label: "Done",
      value: statusSummary.done,
      gradient: "from-emerald-500 to-green-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="m20 6-11 11-5-5" />
        </svg>
      ),
    },
  ];

  if (loading) return <p className="rounded-lg bg-white p-4">Loading dashboard...</p>;
  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-20 w-20 rounded-full bg-violet-300/20 blur-xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Taskrunner Analytics</p>
        <h2 className="mt-2 text-3xl font-bold">Welcome to your dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
          Track performance, monitor team workload, and catch overdue items before they impact delivery.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur">
            <p className="text-xs text-blue-100">Completion</p>
            <p className="text-xl font-semibold">{completionRate}%</p>
          </div>
          <div className="h-2 w-56 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-200 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.label}
            className={`group rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/90">{card.label}</p>
                <p className="mt-1 text-3xl font-bold">{card.value}</p>
              </div>
              <span className="rounded-xl bg-white/20 p-2 text-white/95 transition group-hover:scale-110">
                {card.icon}
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Task Distribution</h3>
          <p className="text-sm text-slate-500">{tasks.length} total tasks</p>
        </div>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600">Todo</span>
              <span className="font-medium text-slate-800">{progressSegments.todo}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400" style={{ width: `${progressSegments.todo}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600">In Progress</span>
              <span className="font-medium text-slate-800">{progressSegments["in-progress"]}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ width: `${progressSegments["in-progress"]}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600">Done</span>
              <span className="font-medium text-slate-800">{progressSegments.done}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: `${progressSegments.done}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="m10.3 3.9-8 13.8A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.3l-8-13.8a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <h3 className="text-lg font-semibold text-red-700">Overdue Tasks</h3>
        </div>
        {overdueTasks.length === 0 ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            Great work. No overdue tasks right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {overdueTasks.map((task) => (
              <li key={task._id} className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="text-sm text-slate-700">
                  Due: {new Date(task.dueDate).toLocaleDateString()} | Status: {statusLabel[task.status]}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">All Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-3">Title</th>
                  <th className="py-3 pr-3">Project</th>
                  <th className="py-3 pr-3">Assignee</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-b border-slate-100 transition hover:bg-slate-50/80">
                    <td className="py-3 pr-3 font-medium text-slate-800">{task.title}</td>
                    <td className="py-3 pr-3 text-slate-600">{task.project?.title || "-"}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white">
                          {getUserInitials(task.assignedTo?.name)}
                        </span>
                        <span className="text-slate-700">{task.assignedTo?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[task.status]}`}>
                        {statusLabel[task.status]}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
