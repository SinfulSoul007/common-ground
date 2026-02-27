import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = (await request.json()) as { role: Role };
  const { role } = body;

  // For hackathon: state is managed client-side
  // This endpoint acknowledges the join request
  console.log(`User joined session ${sessionId} as ${role}`);

  return NextResponse.json({ success: true });
}
