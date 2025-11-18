import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentCardProps {
  paymentRecord: {
    id: string;
    amount_due: number;
    amount_paid: number;
    late_fee_applied: number;
    status: string;
    payment_requests: {
      title: string;
      description: string;
      due_date: string;
      allow_partial: boolean;
    };
  };
  onPaymentComplete: () => void;
}

export default function PaymentCard({ paymentRecord, onPaymentComplete }: PaymentCardProps) {
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const totalDue = paymentRecord.amount_due + paymentRecord.late_fee_applied;
  const remainingBalance = totalDue - paymentRecord.amount_paid;
  const isOverdue = new Date(paymentRecord.payment_requests.due_date) < new Date() && remainingBalance > 0;

  async function handlePayment(amount: number) {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentRecordId: paymentRecord.id,
            amount,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      const { clientSecret } = await response.json();

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      const { error } = await stripe.confirmCardPayment(clientSecret);

      if (error) {
        throw error;
      }

      alert('Payment successful!');
      onPaymentComplete();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handlePayFull() {
    handlePayment(remainingBalance);
  }

  function handlePayCustom() {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0 || amount > remainingBalance) {
      alert('Please enter a valid amount');
      return;
    }
    handlePayment(amount);
  }

  return (
    <div className={`bg-white rounded-2xl shadow-md overflow-hidden border-2 ${
      isOverdue ? 'border-red-300' : paymentRecord.status === 'paid' ? 'border-green-300' : 'border-gray-200'
    }`}>
      <div className={`p-4 ${
        isOverdue ? 'bg-red-50' : paymentRecord.status === 'paid' ? 'bg-green-50' : 'bg-gray-50'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">
              {paymentRecord.payment_requests.title}
            </h3>
            {paymentRecord.payment_requests.description && (
              <p className="text-sm text-gray-600 mt-1">
                {paymentRecord.payment_requests.description}
              </p>
            )}
          </div>
          {paymentRecord.status === 'paid' ? (
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          ) : isOverdue ? (
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
          ) : (
            <DollarSign className="w-8 h-8 text-blue-600 flex-shrink-0" />
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount Due:</span>
            <span className="font-semibold text-gray-900">${paymentRecord.amount_due.toFixed(2)}</span>
          </div>

          {paymentRecord.late_fee_applied > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Late Fee:</span>
              <span className="font-semibold text-red-600">+${paymentRecord.late_fee_applied.toFixed(2)}</span>
            </div>
          )}

          {paymentRecord.amount_paid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Paid:</span>
              <span className="font-semibold text-green-600">-${paymentRecord.amount_paid.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-lg pt-3 border-t-2 border-gray-200">
            <span className="font-bold text-gray-900">Balance:</span>
            <span className={`font-bold ${remainingBalance > 0 ? 'text-gray-900' : 'text-green-600'}`}>
              ${remainingBalance.toFixed(2)}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            <span>Due Date: </span>
            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}>
              {new Date(paymentRecord.payment_requests.due_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {paymentRecord.status !== 'paid' && remainingBalance > 0 && (
          <div className="space-y-3">
            <button
              onClick={handlePayFull}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay Full Amount ($${remainingBalance.toFixed(2)})`}
            </button>

            {paymentRecord.payment_requests.allow_partial && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={remainingBalance}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Custom amount"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handlePayCustom}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Pay
                  </button>
                </div>
                <p className="text-xs text-gray-500">Partial payments allowed</p>
              </div>
            )}
          </div>
        )}

        {paymentRecord.status === 'paid' && (
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-green-700 font-semibold">Payment Complete</p>
          </div>
        )}
      </div>
    </div>
  );
}
