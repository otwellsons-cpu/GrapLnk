import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface PaymentRequestModalProps {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentRequestModal({ teamId, onClose, onSuccess }: PaymentRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    recurring: false,
    recurringInterval: 'monthly',
    allowPartial: true,
    lateFeeAmount: '15.00',
    lateFeeDays: '5',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: paymentRequest, error: requestError } = await supabase
        .from('payment_requests')
        .insert({
          team_id: teamId,
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          due_date: new Date(formData.dueDate).toISOString(),
          recurring: formData.recurring,
          recurring_interval: formData.recurring ? formData.recurringInterval : null,
          allow_partial: formData.allowPartial,
          late_fee_amount: parseFloat(formData.lateFeeAmount),
          late_fee_days: parseInt(formData.lateFeeDays),
        })
        .select()
        .single();

      if (requestError) throw requestError;

      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id, users(role)')
        .eq('team_id', teamId)
        .eq('users.role', 'parent');

      if (teamMembers && teamMembers.length > 0) {
        const paymentRecords = teamMembers.map((member: any) => ({
          payment_request_id: paymentRequest.id,
          parent_id: member.user_id,
          amount_due: parseFloat(formData.amount),
          status: 'pending',
        }));

        await supabase.from('payment_records').insert(paymentRecords);

        const notifications = teamMembers.map((member: any) => ({
          user_id: member.user_id,
          team_id: teamId,
          type: 'payment_request',
          title: 'New Payment Request',
          message: `${formData.title} - $${formData.amount} due by ${new Date(formData.dueDate).toLocaleDateString()}`,
        }));

        await supabase.from('notifications').insert(notifications);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating payment request:', error);
      alert('Failed to create payment request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">New Payment Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Monthly Dues - March"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Practice fees, uniforms, and tournament entry"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="175.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.lateFeeAmount}
                onChange={(e) => setFormData({ ...formData, lateFeeAmount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Fee After (days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.lateFeeDays}
                onChange={(e) => setFormData({ ...formData, lateFeeDays: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.allowPartial}
                onChange={(e) => setFormData({ ...formData, allowPartial: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Allow partial payments</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.recurring}
                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Recurring payment</span>
            </label>

            {formData.recurring && (
              <select
                value={formData.recurringInterval}
                onChange={(e) => setFormData({ ...formData, recurringInterval: e.target.value })}
                className="ml-8 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Payment Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
