import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import {
  generateScopingQuestionsSystemPrompt,
  generateScopingQuestionsUserMessage,
} from '@/lib/prompts';
import type { ProblemStatement } from '@/lib/types';

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      problemStatement: ProblemStatement;
    };
    const { problemStatement } = body;

    if (!problemStatement) {
      return NextResponse.json(
        { error: 'Missing problemStatement' },
        { status: 400 }
      );
    }

    const result = await callClaude(
      generateScopingQuestionsSystemPrompt(),
      generateScopingQuestionsUserMessage(problemStatement),
      { maxTokens: 2048 }
    );

    const parsed = JSON.parse(cleanJsonResponse(result)) as {
      questions: Array<{
        topic: string;
        npoQuestion: string;
        npoContext: string;
        researcherQuestion: string;
        researcherContext: string;
      }>;
    };

    // Cap at 5 questions
    const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 5) : [];
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating scoping questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate scoping questions' },
      { status: 500 }
    );
  }
}
