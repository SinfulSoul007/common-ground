import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import {
  generateCharterSystemPrompt,
  generateCharterUserMessage,
} from '@/lib/prompts';
import type { ProblemStatement, SidebarState } from '@/lib/types';

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      problemStatement: ProblemStatement;
      chatTranscript: string;
      sidebar: SidebarState;
    };
    const { problemStatement, chatTranscript, sidebar } = body;

    const result = await callClaude(
      generateCharterSystemPrompt(),
      generateCharterUserMessage(problemStatement, chatTranscript, sidebar),
      { maxTokens: 4096 }
    );

    const parsed = JSON.parse(cleanJsonResponse(result)) as {
      npoView: string;
      researcherView: string;
    };

    return NextResponse.json({
      npoView: parsed.npoView,
      researcherView: parsed.researcherView,
    });
  } catch (error) {
    console.error('Error generating charter:', error);
    return NextResponse.json(
      { error: 'Failed to generate charter' },
      { status: 500 }
    );
  }
}
