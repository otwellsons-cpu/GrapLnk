import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import CoachDashboard from './components/CoachDashboard';
import ParentDashboard from './components/ParentDashboard';
import { Trophy } from 'lucide-react';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-neon-500 to-neon-600 rounded-2xl mb-6 shadow-lg animate-pulse">
            <Trophy className="w-10 h-10 text-primary-900" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-wider">
            GRAP<span className="text-neon-500">LNK</span>
          </h1>
          <p className="text-neon-400 text-sm font-heading">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  if (profile.role === 'coach') {
    return <CoachDashboard />;
  }

  return <ParentDashboard />;
}

export default App;
