import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import {
  facilitatorCheckSystemPrompt,
  facilitatorCheckUserMessage,
} from '@/lib/prompts';
import type { SidebarState } from '@/lib/types';

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      conversationContext: string;
      sidebar: SidebarState;
    };
    const { conversationContext, sidebar } = body;

    const result = await callClaude(
      facilitatorCheckSystemPrompt(),
      facilitatorCheckUserMessage(conversationContext, sidebar)
    );

    const parsed = JSON.parse(cleanJsonResponse(result)) as {
      shouldInterject: boolean;
      message: string | null;
      sidebarUpdates: {
        newRequirements: string[];
        newConstraints: string[];
        newQuestions: string[];
        resolvedQuestions: string[];
      };
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error in facilitator check:', error);
    return NextResponse.json(
      { error: 'Failed to perform facilitator check' },
      { status: 500 }
    );
  }
}
