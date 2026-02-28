import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import {
  synthesizeAnswersSystemPrompt,
  synthesizeAnswersUserMessage,
} from '@/lib/prompts';
import type { SidebarState } from '@/lib/types';

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      topic: string;
      npoQuestion: string;
      researcherQuestion: string;
      npoAnswer: string;
      researcherAnswer: string;
      currentSidebar: SidebarState;
    };
    const { topic, npoQuestion, researcherQuestion, npoAnswer, researcherAnswer, currentSidebar } = body;

    if (!topic || !npoAnswer || !researcherAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, npoAnswer, researcherAnswer' },
        { status: 400 }
      );
    }

    const result = await callClaude(
      synthesizeAnswersSystemPrompt(),
      synthesizeAnswersUserMessage(topic, npoQuestion, researcherQuestion, npoAnswer, researcherAnswer, currentSidebar),
      { maxTokens: 1536 }
    );

    const parsed = JSON.parse(cleanJsonResponse(result)) as {
      synthesis: string;
      sidebarUpdates: {
        newRequirements: string[];
        newConstraints: string[];
        newQuestions: string[];
        resolvedQuestions: string[];
      };
      followUpQuestion: {
        topic: string;
        npoQuestion: string;
        npoContext: string;
        researcherQuestion: string;
        researcherContext: string;
      } | null;
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error synthesizing answers:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize answers' },
      { status: 500 }
    );
  }
}
