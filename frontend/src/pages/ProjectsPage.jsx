import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const gradients = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-green-400",
  "from-fuchsia-500 to-pink-500",
  "from-orange-500 to-amber-400",
];

const initials = (name = "U") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const ProjectsPage = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    members: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([api.get("/projects"), api.get("/tasks")]);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreateProject = async (event) => {
    event.preventDefault();
    setError("");

    const memberIds = newProject.members
      .split(",")
      .map((member) => member.trim())
      .filter(Boolean);

    try {
      await api.post("/projects", {
        title: newProject.title,
        description: newProject.description,
        members: memberIds,
      });
      setNewProject({ title: "", description: "", members: "" });
      setShowCreate(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  const onDeleteProject = async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  const projectCards = useMemo(() => {
    return projects.map((project, index) => {
      const projectTasks = tasks.filter((task) => task.project?._id === project._id);
      const doneCount = projectTasks.filter((task) => task.status === "done").length;
      const progress = projectTasks.length ? Math.round((doneCount / projectTasks.length) * 100) : 0;
      return {
        ...project,
        progress,
        taskCount: projectTasks.length,
        gradient: gradients[index % gradients.length],
      };
    });
  }, [projects, tasks]);

  if (loading) return <p className="rounded-lg bg-white p-4">Loading projects...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
          <p className="text-sm text-slate-500">Track project progress and team collaboration</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Project
        </button>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {showCreate && (
        <form
          onSubmit={onCreateProject}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Create Project</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Title"
              value={newProject.title}
              onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Member IDs comma-separated"
              value={newProject.members}
              onChange={(e) => setNewProject((prev) => ({ ...prev, members: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Project
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

      <section>
        {projectCards.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No projects yet</h3>
            <p className="mt-1 text-sm text-slate-500">Create your first project to start organizing team work.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((project) => (
              <div
                key={project._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`bg-gradient-to-r ${project.gradient} p-4 text-white`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-white/90">
                        {project.description || "No description provided for this project."}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDeleteProject(project._id)}
                        className="rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-white/30"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Members</p>
                      <p className="text-lg font-semibold text-slate-900">{project.members?.length || 0}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Tasks</p>
                      <p className="text-lg font-semibold text-slate-900">{project.taskCount}</p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-700">{project.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${project.gradient}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(project.members || []).slice(0, 4).map((member) => (
                        <span
                          key={member._id}
                          title={member.name}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white"
                        >
                          {initials(member.name)}
                        </span>
                      ))}
                      {(project.members?.length || 0) > 4 && (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-700">
                          +{project.members.length - 4}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{project.taskCount} active items</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectsPage;
