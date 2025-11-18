export function generateQRCodeURL(code: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(code)}`;
}

export async function generateCheckinCode(eventId: string): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${eventId}-${timestamp}-${random}`;
}
