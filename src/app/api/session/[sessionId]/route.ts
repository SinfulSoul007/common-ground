import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // For hackathon: state is client-side, so we always return exists: true
  // as long as a sessionId was provided
  if (sessionId) {
    return NextResponse.json({ exists: true });
  }

  return NextResponse.json({ exists: false });
}
