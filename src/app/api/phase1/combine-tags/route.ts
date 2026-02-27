import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import { combineTagsSystemPrompt, combineTagsUserMessage } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { tags: string[] };
    const { tags } = body;

    if (!tags || tags.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 tags are required' },
        { status: 400 }
      );
    }

    const result = await callClaude(
      combineTagsSystemPrompt(),
      combineTagsUserMessage(tags)
    );

    return NextResponse.json({ result: result.trim() });
  } catch (error) {
    console.error('Error combining tags:', error);
    return NextResponse.json(
      { error: 'Failed to combine tags' },
      { status: 500 }
    );
  }
}
