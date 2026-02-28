import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import {
  translateResearcherMessageSystemPrompt,
  translateResearcherMessageUserMessage,
  annotateNpoMessageSystemPrompt,
  annotateNpoMessageUserMessage,
} from '@/lib/prompts';
import type { Role } from '@/lib/types';

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      role: Role;
      message: string;
      conversationContext: string;
    };
    const { role, message, conversationContext } = body;

    if (role === 'researcher') {
      const result = await callClaude(
        translateResearcherMessageSystemPrompt(),
        translateResearcherMessageUserMessage(message, conversationContext)
      );

      return NextResponse.json({ displayContent: result });
    }

    if (role === 'npo') {
      const result = await callClaude(
        annotateNpoMessageSystemPrompt(),
        annotateNpoMessageUserMessage(message, conversationContext)
      );

      const parsed = JSON.parse(cleanJsonResponse(result)) as {
        technicalNote: string | null;
      };

      return NextResponse.json({ technicalNote: parsed.technicalNote });
    }

    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error translating message:', error);
    return NextResponse.json(
      { error: 'Failed to translate message' },
      { status: 500 }
    );
  }
}
