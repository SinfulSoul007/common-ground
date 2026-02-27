import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import {
  generateProblemStatementSystemPrompt,
  generateProblemStatementUserMessage,
} from '@/lib/prompts';

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { tags: string[] };
    const { tags } = body;

    const result = await callClaude(
      generateProblemStatementSystemPrompt(),
      generateProblemStatementUserMessage(tags),
      { maxTokens: 2048 }
    );

    let parsed: { plainEnglish: string; technicalInterpretation: string };

    try {
      parsed = JSON.parse(cleanJsonResponse(result));
    } catch {
      // Retry once if parse fails
      const retryResult = await callClaude(
        generateProblemStatementSystemPrompt(),
        generateProblemStatementUserMessage(tags),
        { maxTokens: 2048 }
      );
      parsed = JSON.parse(cleanJsonResponse(retryResult));
    }

    return NextResponse.json({
      plainEnglish: parsed.plainEnglish,
      technicalInterpretation: parsed.technicalInterpretation,
    });
  } catch (error) {
    console.error('Error generating problem statement:', error);
    return NextResponse.json(
      { error: 'Failed to generate problem statement' },
      { status: 500 }
    );
  }
}
