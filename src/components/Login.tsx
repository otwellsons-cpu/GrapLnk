import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Trophy } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-neon-500 to-neon-600 rounded-2xl mb-6 shadow-lg">
            <Trophy className="w-10 h-10 text-primary-900" />
          </div>

          <h1 className="text-5xl font-display font-bold text-gray-900 mb-2 tracking-wider">
            GRAP<span className="text-neon-500">LNK</span>
          </h1>

          <p className="text-gray-600 mb-8 text-lg font-heading">
            WRESTLING & YOUTH SPORTS MANAGEMENT
          </p>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-200 hover:border-neon-500 text-gray-900 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>

          <p className="text-gray-500 text-sm mt-8">
            For coaches, parents, and players
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-neon-400 font-heading">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-400 rounded-full animate-pulse"></div>
              CHECK-INS
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-400 rounded-full animate-pulse"></div>
              PAYMENTS
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-400 rounded-full animate-pulse"></div>
              DRILLS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
