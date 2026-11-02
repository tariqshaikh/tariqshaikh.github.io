/**
 * Shared LLM access for the portfolio apps.
 *
 * Lifted out of PMPrism so there is exactly ONE model ladder. Duplicating it
 * is how gemini-2.5-flash died quietly: it was retired, every call 404'd,
 * llmChat caught the error and fell through to Groq, and the app kept working
 * on the weaker provider for weeks without anyone noticing. One list, one
 * place to fix.
 */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;


export async function groqChat(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  opts: { maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { maxTokens = 1000, jsonMode = false } = opts;
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      // Deliberately not sending response_format: json_object. Groq validates
      // the generation server-side and, on a near-miss, returns "Failed to
      // generate JSON. Please adjust your prompt" with no content at all — so
      // a recoverable response became a hard failure with nothing to salvage,
      // and with Gemini rate-limited there was no other provider left. The
      // system prompt already demands raw JSON and extractJson parses it
      // leniently on our side, which rescues output Groq would have discarded.
      // `jsonMode` is still honoured for Gemini, which handles it reliably.
    }),
  });
  const json = await res.json();
  if (json.error) {
    if (res.status === 429 || json.error.type === 'rate_limit_exceeded') throw new Error('groq_rate_limit');
    throw new Error(json.error.message || 'Groq error');
  }
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');
  return text;
}

/**
 * Appended to the system prompt whenever jsonMode is on.
 *
 * Gemini is held to JSON by `responseMimeType`, but Groq has no equivalent we
 * can safely use — `response_format: json_object` makes a near-miss a hard
 * failure with no content (see groqChat). With nothing enforcing shape, Groq
 * answered a vague prompt conversationally ("Sure thing! Please share the
 * problem...") — zero braces, so extractJson threw "No JSON object found".
 * The same prompt also produced `{"error": "Please provide..."}`, which parses
 * fine but has no branches, so the failure surfaced two different ways.
 *
 * Refusing to ask for clarification is the load-bearing half: the trigger is a
 * question the model considers under-specified, not malformed JSON.
 */
const JSON_ONLY_DIRECTIVE =
  '\n\nOutput ONLY the raw JSON object described above. No preamble, no questions back to the user, ' +
  'no code fences. If the input is vague or incomplete, do NOT ask for clarification and do NOT return ' +
  'an error object — make reasonable assumptions, state them inside the JSON, and still return the full object.';

export async function llmChat(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  opts: { maxTokens?: number; jsonMode?: boolean; onRateLimit?: (secs: number) => void } = {}
): Promise<string> {
  const prompt = opts.jsonMode ? systemPrompt + JSON_ONLY_DIRECTIVE : systemPrompt;
  // Walk the Gemini ladder first, then Groq. Each Gemini model is a separate
  // quota bucket, so a model that's out for the day costs one fast 429 before
  // the next one serves the request.
  const errs: string[] = [];
  if (GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try { return await geminiChat(prompt, messages, { ...opts, model }); }
      catch (e) {
        // Keep the reason. Swallowing it entirely meant a Groq-side failure
        // gave no hint that Gemini had already gone down.
        const m = e instanceof Error ? e.message : 'unknown';
        errs.push(`${model}: ${m}`);
        console.warn(`[Prism] ${model} failed, trying next provider:`, m);
      }
    }
  }
  if (GROQ_API_KEY) {
    // Everything on the Gemini ladder is out — tell the UI before the slower
    // fallback runs, so a long wait isn't silent.
    if (errs.length) opts.onRateLimit?.(-1);
    try { return await groqChat(prompt, messages, opts); }
    catch (e) {
      if (e instanceof Error && errs.length) e.message = `${e.message} (Gemini: ${errs.join('; ')})`;
      throw e;
    }
  }
  throw new Error(errs.length ? `No provider available (${errs.join('; ')})` : 'No AI provider available');
}

/**
 * Gemini models to try, in order. Each is its own free-tier quota bucket.
 *
 * Measured against this key on 2026-09-30 with concurrent bursts, reading the
 * QuotaFailure violation the API returns:
 *
 *   gemini-3.6-flash        GenerateRequestsPerDayPerProjectPerModel = 20
 *   gemini-3.5-flash        only the per-minute cap (5) ever fired
 *   gemini-3-flash-preview  only the per-minute cap (5) ever fired
 *
 * Google gives newer point releases a 20-request-per-DAY free cap, so 3.6
 * exhausted itself almost immediately and every analyse fell through to Groq,
 * which has no JSON enforcement — that's what surfaced as "No JSON object
 * found". 3.6 is deliberately not in this list; it is not deprecated, just
 * too small to rely on. Re-probe before adding a newer model: 3.7 and 3.8
 * exist but are newer still, so they likely carry the same 20/day cap.
 */
export const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3-flash-preview'];

async function geminiChat(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  opts: { maxTokens?: number; jsonMode?: boolean; onRateLimit?: (secs: number) => void; model?: string } = {}
): Promise<string> {
  const { maxTokens = 1000, jsonMode = false, model = GEMINI_MODELS[0] } = opts;
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    // gemini-2.5-flash was retired ("no longer available to new users") and
    // returned 404, so every call silently fell through to the Groq fallback,
    // which has a much tighter rate limit. Model now comes from GEMINI_MODELS.
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: maxTokens,
          // gemini-3.x flash models think by default, and the thinking is billed
          // against maxOutputTokens. Measured on an elaboration request: 1,204
          // tokens went to hidden reasoning and only 693 reached the user, which
          // hit MAX_TOKENS while burning ~3x the quota. Disabling it returned
          // finishReason STOP, 657 total tokens, and roughly double the delivered
          // text in 6s instead of 15s. Set a positive budget here to re-enable.
          thinkingConfig: { thinkingBudget: 0 },
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    }
  );
  const json = await res.json();
  if (json.error) {
    const msg: string = json.error.message || 'API error';
    // Fail fast on a 429 so llmChat can move to the next model, which has its
    // own quota bucket and usually answers immediately. This used to sleep up
    // to 20s and retry the same model — pointless when the daily cap is what
    // was hit, and it showed the user a "retrying in 20s" spinner before
    // failing anyway. (Earlier still it recursed with no cap at all, so a
    // sustained 429 spun forever and the fallback was never reached.)
    if (json.error.code === 429) {
      const quota = json.error.details
        ?.flatMap((d: { violations?: { quotaId?: string; quotaValue?: string }[] }) => d.violations ?? [])
        ?.map((v: { quotaId?: string; quotaValue?: string }) => `${v.quotaId}=${v.quotaValue}`)
        .join(',');
      throw new Error(quota ? `rate limited (${quota})` : 'rate limited');
    }
    throw new Error(msg);
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Empty response (finishReason: ${json.candidates?.[0]?.finishReason ?? 'unknown'})`);
  return text;
}

/**
 * Pull a JSON object out of a model response.
 *
 * Models wrap JSON in code fences, prefix it with "Here's the analysis:", or
 * add a trailing note. Relying on a provider's strict JSON mode turned those
 * near-misses into hard failures with no content returned at all, so we parse
 * defensively instead: strip fences, then fall back to the outermost braces.
 */
export function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first === -1 || last <= first) throw new Error('No JSON object found in response');
    // Throws on its own if the slice still isn't valid — callers handle it.
    return JSON.parse(cleaned.slice(first, last + 1));
  }
}
