import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, DollarSign, Video, TrendingUp, Users, LogOut, Trophy, MessageSquare, Download, QrCode } from 'lucide-react';
import PaymentRequestModal from './PaymentRequestModal';
import BlastMessageModal from './BlastMessageModal';
import QRCheckinModal from './QRCheckinModal';
import { exportAttendanceCSV, exportPaymentReportCSV } from '../lib/csvExport';

interface Team {
  id: string;
  name: string;
  sport: string;
  age_group: string;
  logo_url: string;
  primary_color: string;
}

export default function CoachDashboard() {
  const { profile, signOut } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [creating, setCreating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBlastModal, setShowBlastModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadEvents();
    }
  }, [selectedTeam]);

  async function loadEvents() {
    if (!selectedTeam) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  async function handleExportAttendance() {
    if (!selectedTeam) return;

    try {
      const { data, error } = await supabase
        .from('checkins')
        .select(`
          *,
          events(title),
          users(full_name)
        `)
        .eq('events.team_id', selectedTeam.id);

      if (error) throw error;

      const formatted = (data || []).map((checkin: any) => ({
        ...checkin,
        event_title: checkin.events?.title,
        player_name: checkin.users?.full_name,
      }));

      exportAttendanceCSV(formatted, selectedTeam.name);
    } catch (error) {
      console.error('Error exporting attendance:', error);
      alert('Failed to export attendance');
    }
  }

  async function handleExportPayments() {
    if (!selectedTeam) return;

    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          payment_requests(title, team_id),
          parent:parent_id(full_name),
          player:player_id(full_name)
        `)
        .eq('payment_requests.team_id', selectedTeam.id);

      if (error) throw error;

      const formatted = (data || []).map((payment: any) => ({
        ...payment,
        payment_title: payment.payment_requests?.title,
        parent_name: payment.parent?.full_name,
        player_name: payment.player?.full_name,
      }));

      exportPaymentReportCSV(formatted, selectedTeam.name);
    } catch (error) {
      console.error('Error exporting payments:', error);
      alert('Failed to export payment report');
    }
  }

  function handleShowQRCode(eventId: string) {
    setSelectedEventId(eventId);
    setShowQRModal(true);
  }

  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('created_by', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
      if (data && data.length > 0) {
        setSelectedTeam(data[0]);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createSampleTeam() {
    if (!profile || creating) return;

    try {
      setCreating(true);

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: 'Milton Mayhem',
          sport: 'Baseball',
          age_group: '10U',
          season: 'Spring 2024',
          logo_url: '',
          primary_color: '#1e40af',
          created_by: profile.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: profile.id,
        role: 'coach',
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(16, 0, 0, 0);

      await supabase.from('events').insert({
        team_id: team.id,
        title: 'Team Practice',
        date: tomorrow.toISOString(),
        location: 'Milton Sports Complex - Field 2',
        type: 'practice',
        required_checkin: true,
        notes: 'Bring your glove and cleats',
        created_by: profile.id,
      });

      loadTeams();
    } catch (error) {
      console.error('Error creating sample team:', error);
      alert('Failed to create sample team');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Coach Dashboard</h1>
              <p className="text-blue-100 mt-1">Welcome, {profile?.full_name}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {teams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your First Team</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started with a sample team pre-loaded with events
            </p>
            <button
              onClick={createSampleTeam}
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Trophy className="w-5 h-5" />
              {creating ? 'Creating...' : 'Create Milton Mayhem 10U Baseball'}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setSelectedTeam(team || null);
                }}
                className="w-full max-w-md px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} - {team.age_group} {team.sport}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <ActionCard icon={Calendar} title="New Practice" description="Schedule a practice session" color="from-blue-500 to-blue-600" onClick={() => {}} />
                  <ActionCard icon={DollarSign} title="Payment Request" description="Send payment request to parents" color="from-green-500 to-green-600" onClick={() => setShowPaymentModal(true)} />
                  <ActionCard icon={Video} title="Post Drill" description="Share drill of the week" color="from-indigo-500 to-indigo-600" onClick={() => {}} />
                  <ActionCard icon={TrendingUp} title="Start Fundraiser" description="Create a donation campaign" color="from-orange-500 to-orange-600" onClick={() => {}} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <ActionCard icon={MessageSquare} title="Blast Message" description="Send message to all parents" color="from-blue-600 to-blue-700" onClick={() => setShowBlastModal(true)} />
                  <ActionCard icon={Download} title="Export Attendance" description="Download attendance CSV" color="from-gray-600 to-gray-700" onClick={handleExportAttendance} />
                  <ActionCard icon={Download} title="Export Payments" description="Download payment report" color="from-gray-600 to-gray-700" onClick={handleExportPayments} />
                  <ActionCard icon={QrCode} title="QR Check-in" description="Generate QR code for event" color="from-green-600 to-green-700" onClick={() => events.length > 0 && handleShowQRCode(events[0].id)} />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h3>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm text-gray-500">{event.location}</p>
                        </div>
                        <button
                          onClick={() => handleShowQRCode(event.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          QR Code
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No upcoming events scheduled</p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Team Roster</h3>
                </div>
                <p className="text-gray-500">No team members yet</p>
              </div>
            </div>
          </>
        )}
      </main>

      {showPaymentModal && selectedTeam && (
        <PaymentRequestModal
          teamId={selectedTeam.id}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {}}
        />
      )}

      {showBlastModal && selectedTeam && (
        <BlastMessageModal
          teamId={selectedTeam.id}
          onClose={() => setShowBlastModal(false)}
          onSuccess={() => {}}
        />
      )}

      {showQRModal && selectedEventId && (
        <QRCheckinModal
          eventId={selectedEventId}
          eventTitle={events.find(e => e.id === selectedEventId)?.title || 'Event'}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}

function ActionCard({ icon: Icon, title, description, color, onClick }: ActionCardProps) {
  return (
    <button onClick={onClick} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-left transform hover:-translate-y-1">
      <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${color} rounded-xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
