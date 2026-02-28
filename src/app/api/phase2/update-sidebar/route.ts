import { NextResponse } from 'next/server';

export async function POST() {
  // Sidebar state is managed client-side for the hackathon
  return NextResponse.json({ ok: true });
}
