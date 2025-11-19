export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const cell = row[header];
        if (cell === null || cell === undefined) return '';
        const value = String(cell).replace(/"/g, '""');
        return value.includes(',') || value.includes('"') || value.includes('\n')
          ? `"${value}"`
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAttendanceCSV(checkins: any[], teamName: string) {
  const formatted = checkins.map(checkin => ({
    Date: new Date(checkin.timestamp).toLocaleDateString(),
    Time: new Date(checkin.timestamp).toLocaleTimeString(),
    'Player Name': checkin.player_name || 'Unknown',
    'Event Title': checkin.event_title || 'Unknown Event',
    Status: checkin.status || 'present',
    'Parent Note': checkin.parent_note || '',
  }));

  exportToCSV(formatted, `${teamName}_attendance`);
}

export function exportPaymentReportCSV(payments: any[], teamName: string) {
  const formatted = payments.map(payment => ({
    'Payment Date': payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending',
    'Parent Name': payment.parent_name || 'Unknown',
    'Player Name': payment.player_name || 'Unknown',
    'Payment Title': payment.payment_title || 'Unknown',
    'Amount Due': `$${payment.amount_due?.toFixed(2) || '0.00'}`,
    'Amount Paid': `$${payment.amount_paid?.toFixed(2) || '0.00'}`,
    'Late Fee': `$${payment.late_fee_applied?.toFixed(2) || '0.00'}`,
    Status: payment.status || 'pending',
    'Stripe ID': payment.stripe_payment_intent_id || '',
  }));

  exportToCSV(formatted, `${teamName}_payment_report`);
}
