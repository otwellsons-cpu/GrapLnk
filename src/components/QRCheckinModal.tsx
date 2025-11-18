import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateCheckinCode, generateQRCodeURL } from '../lib/qrCode';
import { X, QrCode as QrIcon } from 'lucide-react';

interface QRCheckinModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function QRCheckinModal({ eventId, eventTitle, onClose }: QRCheckinModalProps) {
  const [qrCodeURL, setQRCodeURL] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateCode();
  }, []);

  async function generateCode() {
    try {
      setLoading(true);
      const newCode = await generateCheckinCode(eventId);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4);

      const { error } = await supabase
        .from('qr_checkin_codes')
        .insert({
          event_id: eventId,
          code: newCode,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      const checkinURL = `${window.location.origin}/checkin/${newCode}`;
      setCode(newCode);
      setQRCodeURL(generateQRCodeURL(checkinURL));
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">QR Check-in</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4">
            <QrIcon className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">{eventTitle}</h3>
          <p className="text-gray-600 mb-6">
            Parents can scan this QR code to check in their players
          </p>

          {loading ? (
            <div className="bg-gray-100 rounded-xl p-12">
              <p className="text-gray-600">Generating QR code...</p>
            </div>
          ) : (
            <>
              <div className="bg-white border-4 border-gray-200 rounded-xl p-4 inline-block mb-6">
                <img
                  src={qrCodeURL}
                  alt="QR Check-in Code"
                  className="w-64 h-64"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Check-in Code</p>
                <p className="text-sm font-mono font-bold text-gray-900 break-all">{code}</p>
              </div>

              <p className="text-sm text-gray-500">
                QR code expires in 4 hours
              </p>
            </>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
