import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import {
  generateCharterNpoOnlySystemPrompt,
  generateCharterResearcherOnlySystemPrompt,
  generateCharterUserMessage,
} from '@/lib/prompts';
import type { ProblemStatement, SidebarState } from '@/lib/types';

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

/** Extract the first complete JSON object from the string (model sometimes appends extra text). */
function extractFirstJsonObject(str: string): string {
  const cleaned = cleanJsonResponse(str);
  const start = cleaned.indexOf('{');
  if (start === -1) return cleaned;
  let depth = 0;
  let inString = false;
  let escape = false;
  let quote = '';
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      escape = true;
      continue;
    }
    if (!inString) {
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return cleaned.slice(start, i + 1);
      } else if (c === '"' || c === "'") {
        inString = true;
        quote = c;
      }
      continue;
    }
    if (c === quote) inString = false;
  }
  return cleaned.slice(start);
}

function parseOneKey<T extends string>(
  raw: string,
  key: T,
  alternateKeys?: string[]
): Record<T, string> {
  const jsonStr = extractFirstJsonObject(raw);
  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  let value = String(parsed?.[key] ?? '').trim();
  if (!value && alternateKeys?.length) {
    for (const alt of alternateKeys) {
      value = String(parsed?.[alt] ?? '').trim();
      if (value) break;
    }
  }
  if (!value) throw new Error(`Charter response missing ${key}`);
  return { [key]: value } as Record<T, string>;
}

const FALLBACK_VIEW = '## Content unavailable\n\nThis section could not be generated. Please try again or refresh the page.';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      problemStatement: ProblemStatement;
      chatTranscript: string;
      sidebar: SidebarState;
    };
    const { problemStatement, chatTranscript, sidebar } = body;
    const userMessage = generateCharterUserMessage(problemStatement, chatTranscript, sidebar);

    // Short charters = faster generation; lower maxTokens so responses finish in seconds
    const [npoResult, researcherResult] = await Promise.all([
      callClaude(generateCharterNpoOnlySystemPrompt(), userMessage, { maxTokens: 1536 }),
      callClaude(generateCharterResearcherOnlySystemPrompt(), userMessage, { maxTokens: 1536 }),
    ]);

    let npoView = FALLBACK_VIEW;
    let researcherView = FALLBACK_VIEW;

    try {
      const npoParsed = parseOneKey(npoResult, 'npoView');
      npoView = npoParsed.npoView || npoView;
    } catch (e) {
      console.error('Charter npoView parse failed:', e);
    }
    try {
      const resParsed = parseOneKey(researcherResult, 'researcherView', [
        'researcher_view',
        'technicalView',
        'researcher',
      ]);
      researcherView = resParsed.researcherView || researcherView;
    } catch (e) {
      console.error('Charter researcherView parse failed:', e);
    }

    if (npoView === FALLBACK_VIEW && researcherView === FALLBACK_VIEW) {
      return NextResponse.json(
        { error: 'Could not parse charter from the model. Please try again.' },
        { status: 500 }
      );
    }

    // If one view failed, use the other so both roles have something to see
    if (researcherView === FALLBACK_VIEW && npoView !== FALLBACK_VIEW) {
      researcherView = `${npoView}\n\n---\n*Researcher view could not be generated; above is the NPO summary.*`;
    }
    if (npoView === FALLBACK_VIEW && researcherView !== FALLBACK_VIEW) {
      npoView = `${researcherView}\n\n---\n*NPO view could not be generated; above is the technical summary.*`;
    }

    return NextResponse.json({
      npoView,
      researcherView,
    });
  } catch (error) {
    console.error('Error generating charter:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate charter. Try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
