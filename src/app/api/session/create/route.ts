import { NextResponse } from 'next/server';

export async function POST() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sessionId = '';
  for (let i = 0; i < 6; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return NextResponse.json({ sessionId });
}
