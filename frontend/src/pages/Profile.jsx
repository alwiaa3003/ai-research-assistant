import Navbar from "../components/Navbar/Navbar";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-sage-800 mb-6">Profile</h1>
        <div className="bg-white border border-sage-100 rounded-2xl p-6 space-y-4 shadow-soft">
          <div>
            <p className="text-sm text-sage-400">Name</p>
            <p className="font-medium text-sage-800">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-sage-400">Email</p>
            <p className="font-medium text-sage-800">{user?.email}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;