import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-cream border-b border-sage-100">
      <Link
        to="/dashboard"
        className="font-semibold text-lg text-sage-800 tracking-tight"
      >
        🌿 AI Research Assistant
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/dashboard"
          className="text-sm text-sage-600 hover:text-sage-800 transition"
        >
          Dashboard
        </Link>

        <Link
          to="/chat"
          className="text-sm text-sage-600 hover:text-sage-800 transition"
        >
          Chat
        </Link>

        <Link
          to="/documents"
          className="text-sm text-sage-600 hover:text-sage-800 transition"
        >
          Documents
        </Link>

        <Link
          to="/history"
          className="text-sm text-sage-600 hover:text-sage-800 transition"
        >
          History
        </Link>

        <Link
          to="/profile"
          className="text-sm text-sage-600 hover:text-sage-800 transition"
        >
          Profile
        </Link>

        {user && (
          <span className="text-sm font-medium text-sage-700">
            {user.name}
          </span>
        )}

        {user ? (
          <button
            onClick={handleLogout}
            className="text-sm text-sage-500 hover:text-sage-700 px-3 py-1.5 rounded-full hover:bg-sage-100 transition"
          >
            Log out
          </button>
        ) : (
          <Link
            to="/login"
            className="text-sm text-sage-600 hover:underline"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;