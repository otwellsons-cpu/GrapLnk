import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Calendar, DollarSign, Bell, CheckCircle } from 'lucide-react';
import PaymentCard from './PaymentCard';
import { subscribeToPushNotifications } from '../lib/notifications';

export default function ParentDashboard() {
  const { profile, signOut } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    requestNotifications();
  }, [profile]);

  async function requestNotifications() {
    if (profile) {
      await subscribeToPushNotifications(profile.id);
    }
  }

  async function loadData() {
    if (!profile) return;

    try {
      const { data: teamData } = await supabase
        .from('team_members')
        .select('teams(*)')
        .eq('user_id', profile.id);

      const myTeams = teamData?.map(t => t.teams) || [];
      setTeams(myTeams);

      if (myTeams.length > 0) {
        const teamIds = myTeams.map(t => t.id);

        const { data: paymentData } = await supabase
          .from('payment_records')
          .select('*, payment_requests(*)')
          .eq('parent_id', profile.id)
          .in('payment_requests.team_id', teamIds)
          .neq('status', 'paid')
          .order('payment_requests.due_date', { ascending: true });

        setPayments(paymentData || []);

        const { data: eventData } = await supabase
          .from('events')
          .select('*')
          .in('team_id', teamIds)
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(5);

        setEvents(eventData || []);

        const { data: notificationData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(10);

        setNotifications(notificationData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markNotificationRead(id: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications(notifications.filter(n => n.id !== id));
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
              <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
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
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Teams Yet</h2>
            <p className="text-gray-600">Contact your coach to be added to a team</p>
          </div>
        ) : (
          <div className="space-y-8">
            {notifications.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                </div>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start justify-between p-4 bg-blue-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        className="ml-4 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Payments Due</h2>
              </div>

              {payments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {payments.map((payment) => (
                    <PaymentCard
                      key={payment.id}
                      paymentRecord={payment}
                      onPaymentComplete={loadData}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-gray-600">All payments up to date!</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
              </div>

              {events.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-md divide-y divide-gray-200">
                  {events.map((event) => (
                    <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(event.date).toLocaleDateString()} at{' '}
                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                          {event.notes && (
                            <p className="text-sm text-gray-500 mt-2">{event.notes}</p>
                          )}
                        </div>
                        {event.required_checkin && (
                          <button className="ml-4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all shadow-md">
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
