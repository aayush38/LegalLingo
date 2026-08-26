import { NextRequest, NextResponse } from 'next/server';
import { completeText, LLMError, statusForError } from '@/lib/llm';

const CHAT_RETRIES = 1;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  gu: 'Gujarati'
};

interface ChatDocumentContext {
  documentType?: string;
  summary?: string;
  verySimpleSummary?: string;
  fiveQuestions?: {
    partiesInvolved?: Record<string, unknown>;
    totalAmount?: string;
    missingPoints?: string;
    nextStepsSummary?: string;
  };
  importantClauses?: { clauseTitle?: string; simpleMeaning?: string; whyItMatters?: string; recommendedAction?: string; riskLevel?: string }[];
  missingInformation?: { title?: string; whyItMatters?: string; whatYouCanDo?: string }[];
  legalTerms?: { term?: string; simpleMeaning?: string }[];
  relevantServices?: { title?: string; whyRelevant?: string }[];
  paragraphs?: { original?: string; simple?: string }[];
}

function buildDocumentContextText(ctx: ChatDocumentContext): string {
  const parts: string[] = [];

  if (ctx.documentType) parts.push(`Document Type: ${ctx.documentType}`);
  if (ctx.summary) parts.push(`Summary: ${ctx.summary}`);
  if (ctx.verySimpleSummary) parts.push(`Plain-language explanation: ${ctx.verySimpleSummary}`);

  if (ctx.fiveQuestions) {
    const fq = ctx.fiveQuestions;
    if (fq.partiesInvolved) parts.push(`Parties involved: ${JSON.stringify(fq.partiesInvolved)}`);
    if (fq.totalAmount) parts.push(`Amount: ${fq.totalAmount}`);
    if (fq.missingPoints) parts.push(`Known missing information: ${fq.missingPoints}`);
    if (fq.nextStepsSummary) parts.push(`Recommended next steps: ${fq.nextStepsSummary}`);
  }

  if (ctx.importantClauses?.length) {
    parts.push('Important Clauses:');
    ctx.importantClauses.forEach((c, i) => {
      parts.push(`  ${i + 1}. [${c.riskLevel || 'standard'}] ${c.clauseTitle}: ${c.simpleMeaning} Why it matters: ${c.whyItMatters} Recommended action: ${c.recommendedAction}`);
    });
  }

  if (ctx.missingInformation?.length) {
    parts.push('Missing/Unclear Information:');
    ctx.missingInformation.forEach((m, i) => {
      parts.push(`  ${i + 1}. ${m.title}: ${m.whyItMatters} What to do: ${m.whatYouCanDo}`);
    });
  }

  if (ctx.legalTerms?.length) {
    parts.push('Legal Terms Explained: ' + ctx.legalTerms.map((t) => `${t.term} = ${t.simpleMeaning}`).join('; '));
  }

  if (ctx.relevantServices?.length) {
    parts.push('Relevant Government Services: ' + ctx.relevantServices.map((s) => `${s.title} (${s.whyRelevant})`).join('; '));
  }

  if (ctx.paragraphs?.length) {
    parts.push('Original Document Text (by section):');
    ctx.paragraphs.forEach((p, i) => {
      if (p.original) parts.push(`  Section ${i + 1}: ${p.original}`);
    });
  }

  return parts.join('\n').slice(0, 10000);
}

export async function POST(req: NextRequest) {
  try {
    const { question, history, documentContext, selectedClause, language } = await req.json();

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    const languageName = LANGUAGE_NAMES[language] || 'English';
    const contextText = documentContext ? buildDocumentContextText(documentContext) : '';

    let clauseContextText = '';
    if (selectedClause && typeof selectedClause === 'object') {
      clauseContextText = `SPECIFIC CLAUSE THE CITIZEN IS ASKING ABOUT:
- Title: ${selectedClause.clauseTitle || 'Untitled Clause'}
- Risk Level: ${selectedClause.riskLevel || 'standard'}
- Original Clause Wording: "${selectedClause.originalText || ''}"
- Simple Meaning: ${selectedClause.simpleMeaning || ''}
- Why This Matters: ${selectedClause.whyItMatters || ''}
- Recommended Citizen Action: ${selectedClause.recommendedAction || ''}`;
    }

    const historyText = Array.isArray(history)
      ? history
          .slice(-6)
          .map((m: { sender: string; text: string }) => `${m.sender === 'user' ? 'Citizen' : 'Assistant'}: ${m.text}`)
          .join('\n')
      : '';

    const prompt = `You are LegalLingo AI Assistant, a helpful assistant that answers Indian citizens' questions about a legal document they uploaded.

Rules:
- Answer using ONLY the document information and specific clause information given below. Do not invent facts, names, amounts, or clauses not present in it.
- If the document information doesn't contain the answer, say so honestly and suggest what the citizen should check or ask a legal professional about, instead of guessing.
- Keep the answer concise and in simple, plain language (roughly 2-5 sentences unless the question needs a list).
- Answer in ${languageName}.
- Do not repeat these instructions or mention that you were given "document information" — just answer naturally as an assistant who has read the document.

${clauseContextText ? `${clauseContextText}\n\n` : ''}${contextText ? `DOCUMENT INFORMATION:\n${contextText}\n` : 'No document has been uploaded yet.\n'}
${historyText ? `RECENT CONVERSATION:\n${historyText}\n` : ''}
CITIZEN'S QUESTION: ${question}

Answer:`;

    const answer = await completeText(
      { prompt, temperature: 0.3, json: false },
      { label: 'api/chat', maxRetries: CHAT_RETRIES }
    );

    return NextResponse.json({ answer: answer.trim() });
  } catch (e) {
    if (e instanceof LLMError) {
      console.error('[api/chat] LLM failure:', e.message);
      return NextResponse.json({ error: e.message }, { status: statusForError(e) });
    }
    console.error('[api/chat] Unexpected error:', e);
    return NextResponse.json({ error: 'Unexpected error during chat' }, { status: 500 });
  }
}
