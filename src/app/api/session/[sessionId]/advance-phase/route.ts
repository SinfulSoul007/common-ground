import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // Phase advancement is managed client-side for the hackathon
  await params;
  return NextResponse.json({ ok: true });
}
