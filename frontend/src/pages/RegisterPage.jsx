import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [error, setError] = useState("");

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const result = await register(form);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Register</h1>
        <p className="mb-5 text-sm text-slate-500">Create your Taskrunner account.</p>

        {error && <p className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>}

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            required
            minLength={6}
          />
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={onChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
