import { Trophy } from 'lucide-react';

export default function TestApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6 shadow-lg">
          <Trophy className="w-10 h-10 text-blue-900" />
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-2 tracking-wider" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          GRAP<span className="text-green-500">LNK</span>
        </h1>

        <p className="text-gray-600 mb-8 text-lg font-semibold">
          WRESTLING & YOUTH SPORTS MANAGEMENT
        </p>

        <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4 mb-4">
          <p className="text-green-800 font-semibold">✓ App is loading correctly!</p>
        </div>

        <p className="text-gray-500 text-sm">
          The application is working. If you see this message, the React app is rendering successfully.
        </p>

        <div className="mt-6 space-y-2 text-left bg-gray-100 p-4 rounded-lg">
          <p className="text-xs font-mono text-gray-700">
            <strong>Environment:</strong>
          </p>
          <p className="text-xs font-mono text-gray-600">
            Mode: {import.meta.env.MODE}
          </p>
          <p className="text-xs font-mono text-gray-600">
            Has Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗'}
          </p>
          <p className="text-xs font-mono text-gray-600">
            Has Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗'}
          </p>
        </div>
      </div>
    </div>
  );
}
