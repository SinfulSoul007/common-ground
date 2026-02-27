import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // State is managed client-side for the hackathon
  await params;
  return NextResponse.json({ ok: true });
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // State is managed client-side for the hackathon
  await params;
  return NextResponse.json({ ok: true });
}
