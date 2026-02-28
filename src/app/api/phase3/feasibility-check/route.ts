import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import {
  feasibilityCheckSystemPrompt,
  feasibilityCheckUserMessage,
} from '@/lib/prompts';
import type { Charter, ProblemStatement, SidebarState } from '@/lib/types';

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      charter: Charter;
      problemStatement: ProblemStatement;
      sidebar: SidebarState;
    };
    const { charter, problemStatement, sidebar } = body;

    const result = await callClaude(
      feasibilityCheckSystemPrompt(),
      feasibilityCheckUserMessage(charter, problemStatement, sidebar),
      { maxTokens: 2048 }
    );

    const parsed = JSON.parse(cleanJsonResponse(result)) as {
      flags: Array<{
        category: string;
        severity: string;
        description: string;
        recommendation: string;
      }>;
    };

    return NextResponse.json({ flags: parsed.flags });
  } catch (error) {
    console.error('Error in feasibility check:', error);
    return NextResponse.json(
      { error: 'Failed to perform feasibility check' },
      { status: 500 }
    );
  }
}
