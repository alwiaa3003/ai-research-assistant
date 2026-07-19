import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-soft border border-sage-100 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🌿</div>
          <h1 className="text-2xl font-semibold text-sage-800">Create account</h1>
        </div>

        {error && (
          <p className="text-rose-600 text-sm mb-4 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <label className="block text-sm font-medium text-sage-700 mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border border-sage-200 rounded-xl px-3 py-2.5 mb-4 bg-cream/40 focus:outline-none focus:ring-2 focus:ring-sage-400 text-sage-900"
        />

        <label className="block text-sm font-medium text-sage-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border border-sage-200 rounded-xl px-3 py-2.5 mb-4 bg-cream/40 focus:outline-none focus:ring-2 focus:ring-sage-400 text-sage-900"
        />

        <label className="block text-sm font-medium text-sage-700 mb-1">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full border border-sage-200 rounded-xl px-3 py-2.5 mb-6 bg-cream/40 focus:outline-none focus:ring-2 focus:ring-sage-400 text-sage-900"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sage-600 text-white py-2.5 rounded-xl font-medium hover:bg-sage-700 transition disabled:opacity-50 shadow-soft"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-sm text-center mt-5 text-sage-600">
          Already have an account?{" "}
          <Link to="/login" className="text-sage-700 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;