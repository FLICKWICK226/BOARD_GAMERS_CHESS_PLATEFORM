import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Service role client for credit operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ────────────────────────────────────────────
// POST /api/coach
// Streaming chess coaching via Claude
// Body: { fen: string, question: string, userLevel: string }
// ────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ── Prompt engineering per user level ──
function buildSystemPrompt(userLevel: string): string {
  const levelInstructions: Record<string, string> = {
    beginner: `Tu parles à un DÉBUTANT (Elo < 800). 
      - Ton ton doit être extrêmement ENCOURAGEANT et BIENVEILLANT.
      - Utilise des termes très simples. Évite tout jargon (zugzwang, fianchetto, structure de pions) sauf si indispensable.
      - Priorité 1 : La SÉCURITÉ des pièces (est-ce que je peux me faire manger ?).
      - Priorité 2 : Les CAPTURES simples.
      - Explique pour chaque coup son but immédiat (ex: "On bouge le Cavalier pour attaquer son Pion central").
      - Utilise des analogies simples (ex: "Le Roi est comme un général en danger").`,

    intermediate: `Tu parles à un joueur INTERMÉDIAIRE (Elo 1000–1500).
      - Utilise un ton PÉDAGOGIQUE et TECHNIQUE.
      - Tu DOIS nommer les motifs TACTIQUES rencontrés : Fourchette, Clouage, Enfilade, Attaque à la découverte, Déviation, Sacrifice d'attraction.
      - Explique les concepts POSITIONNELS : Pièce active vs passive, Colonne ouverte, Case forte (outpost), Paire de fous.
      - Propose des variantes de 2-3 coups avec la notation algébrique.
      - Analyse la structure de pions (pions doublés, arriérés, etc.).`,

    expert: `Tu parles à un joueur EXPERT (Elo 1800+ / Maître).
      - Ton ton doit être ANALYTIQUE, FROID et PRÉCIS.
      - Tu DOIS inclure une évaluation en CENTIPAWNS si possible (ex: +1.2, -0.8, 0.00).
      - Analyse en PROFONDEUR avec des variantes longues (4+ coups) explorant les lignes forcées.
      - Aborde les nuances théoriques d'OUVERTURE et de FINALE (ex: "Structure de Carlsbad", "Finale de Tours Lucena").
      - Utilise le jargon technique sans retenue : Prophylaxie, Compensation, Initiative, Zugzwang, Intermezzo, Avantage d'espace.
      - Critique les imprécisions subtiles de la position.`,
  };

  const levelContext = levelInstructions[userLevel] || levelInstructions['intermediate'];

  return `Tu es un coach d'échecs expert (Grand Maître virtuel), intégré dans la plateforme Board Chess.
Ton rôle est d'analyser la position FEN fournie et de répondre à l'utilisateur selon son niveau.

## RÉGLES DE RÉPONSE :
1. ANALYSE FEN : Analyse méticuleusement la position FEN avant de parler.
2. LANGUE : Réponds exclusivement en français.
3. STRUCTURE : Utilise le Markdown pour la lisibilité (listes, gras pour les coups).
4. NOTATION : Utilise la notation algébrique (ex: e4, Cf3, O-O).
5. CONCIS : Ne dépasse pas 500 mots, va droit au but.

## CONTEXTE DE NIVEAU :
${levelContext}

## DIRECTIVES SPÉCIALES :
- Si l'utilisateur demande "Le meilleur coup" : Donne le coup optimal selon toi, explique pourquoi il est fort, et mentionne une alternative si elle existe.
- Si FEN est absent ou invalide : Demande poliment à l'utilisateur de fournir une position valide ou aide-le sur sa question théorique.`;
}

// ── Validate FEN format (basic sanity check) ──
function isValidFen(fen: string): boolean {
  // FEN must have 6 space-separated fields
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4 || parts.length > 6) return false;
  // First field: piece placement must have 8 ranks
  const ranks = parts[0].split('/');
  if (ranks.length !== 8) return false;
  return true;
}

// ── Allowed user levels ──
const ALLOWED_LEVELS = ['beginner', 'intermediate', 'expert'];

export async function POST(request: Request) {
  // ── Auth: verify user is logged in via Supabase ──
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: missing authentication token.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: invalid session.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Parse & validate body ──
  let body: { fen?: string; question?: string; userLevel?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { fen, question, userLevel } = body;

  if (!fen || typeof fen !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid "fen" field.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!isValidFen(fen)) {
    return new Response(
      JSON.stringify({ error: 'Invalid FEN format.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Missing or empty "question" field.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (question.length > 1000) {
    return new Response(
      JSON.stringify({ error: 'Question too long (max 1000 characters).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const level = ALLOWED_LEVELS.includes(userLevel || '')
    ? userLevel!
    : 'intermediate';

  // ── Credit check: decrement atomically via RPC ──
  const { data: creditsAfter, error: creditError } = await supabaseAdmin
    .rpc('decrement_ai_credits', { p_user_id: user.id });

  if (creditError) {
    console.error('[/api/coach] Credit check failed:', creditError.message);
    return new Response(
      JSON.stringify({ error: 'Erreur interne lors de la vérification des crédits.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (creditsAfter === -1) {
    return new Response(
      JSON.stringify({ error: 'Utilisateur introuvable.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (creditsAfter === 0 && !creditError) {
    // RPC returned 0 = user had 0 credits BEFORE call, nothing was decremented
    // But wait — our function returns 0 when credits <= 0 (no decrement)
    // So we need to check if the user actually had credits
    // creditsAfter === 0 from RPC means "had 0 credits, blocked"
    return new Response(
      JSON.stringify({
        error: 'Crédits IA épuisés. Vous avez utilisé tous vos 20 crédits gratuits.',
        code: 'NO_CREDITS',
        credits_remaining: 0,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Build the user message with FEN context ──
  const userMessage = `Position FEN actuelle : ${fen}

Question du joueur : ${question}`;

  // ── Stream from Claude ──
  try {
    const stream = anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: buildSystemPrompt(level),
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    // Convert Anthropic SDK stream to Web ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }

          // Signal stream completion
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamError) {
          const errorMessage =
            streamError instanceof Error ? streamError.message : 'Stream error';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Credits-Remaining': String(creditsAfter),
      },
    });
  } catch (error) {
    console.error('[/api/coach] Claude API error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return new Response(
      JSON.stringify({ error: `Coach AI error: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ────────────────────────────────────────────
// GET /api/coach
// Returns remaining AI credits for the authenticated user
// ────────────────────────────────────────────
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data: credits, error: creditError } = await supabaseAdmin
    .rpc('get_ai_credits', { p_user_id: user.id });

  if (creditError) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch credits.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ credits_remaining: credits }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
