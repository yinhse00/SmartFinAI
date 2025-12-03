import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type QuickAction = 'improve' | 'summarize' | 'rewrite' | 'compliance' | 'translate' | 'formal' | 'custom';

interface QuickActionRequest {
  action: QuickAction;
  selectedText: string;
  customPrompt?: string;
  targetLanguage?: 'en' | 'zh-TW' | 'zh-CN';
}

// Anti-markdown and anti-preamble rules to add to all prompts
const OUTPUT_FORMAT_RULES = `

CRITICAL OUTPUT FORMAT RULES:
- Output PLAIN TEXT ONLY - absolutely NO markdown formatting
- Do NOT use: ** (bold), * (italic), ## (headers), - (bullets), \` (code blocks)
- Do NOT start with "Okay", "Here's", "Sure", "I've", "Certainly", or any preamble
- Do NOT add any explanation before or after the text
- Do NOT add commentary about what you changed
- Start DIRECTLY with the revised text content
- End DIRECTLY when the content ends`;

const ACTION_PROMPTS: Record<QuickAction, string> = {
  improve: `You are a senior IPO prospectus editor at a top-tier investment bank (Goldman Sachs, Morgan Stanley caliber). Your task is to improve text for Hong Kong Stock Exchange disclosure documents.

EDITING RULES - FOLLOW STRICTLY:
1. PRESERVE EXACTLY: All numbers, dates, percentages, company names, person names, regulatory citations, and technical terminology
2. STRUCTURE: Maintain the original paragraph structure, bullet points, and formatting
3. LENGTH: Keep similar length to original (±10% words maximum)
4. TONE: Use formal, authoritative language appropriate for institutional investors and regulators
5. CLARITY: Simplify overly complex sentences, but DO NOT oversimplify technical/legal content
6. GRAMMAR: Fix grammatical errors, improve word choice, enhance readability

WHAT YOU MUST NOT DO:
- Do NOT add new information or claims not in the original
- Do NOT remove key details, disclaimers, or qualifications
- Do NOT change the meaning or implication of any statement
- Do NOT add promotional or marketing language
- Do NOT explain your changes - output ONLY the improved text
${OUTPUT_FORMAT_RULES}`,
  
  summarize: `You are a senior IPO prospectus editor. Summarize this text concisely for Hong Kong Stock Exchange disclosure documents.

SUMMARIZATION RULES:
1. Retain ALL key facts, figures, dates, and names
2. Preserve critical risk factors and disclaimers
3. Maintain formal, professional tone
4. Target 40-60% of original length
5. Do NOT omit material information that would affect investor decisions

MUST INCLUDE in summary:
- All numerical data (revenue, percentages, dates)
- Key risk factors mentioned
- Regulatory requirements cited
- Material facts about the business
${OUTPUT_FORMAT_RULES}`,
  
  rewrite: `You are a senior IPO prospectus editor. Rewrite this text with alternative phrasing while maintaining identical meaning for Hong Kong Stock Exchange disclosure documents.

REWRITING RULES:
1. Use different sentence structures and word choices
2. Maintain the EXACT same meaning and implications
3. Keep similar length (±10% words)
4. Preserve all factual information exactly
5. Maintain formal, professional tone

PRESERVE EXACTLY - DO NOT CHANGE:
- All numbers, dates, percentages
- Company names, person names, regulatory citations
- Technical terminology and defined terms
- The logical flow and structure of information
${OUTPUT_FORMAT_RULES}`,
  
  compliance: `You are an HKEX Listing Rules compliance expert with 15+ years experience reviewing IPO prospectuses. Analyze this text for compliance with Hong Kong Stock Exchange Main Board Listing Rules.

CHECK AGAINST:
1. Chapter 8: Qualification for Listing (Rule 8.05 profit test, Rule 8.05A market cap test)
2. Chapter 11: Listing Documents (completeness, accuracy, material information)
3. Chapter 14: Notifiable Transactions (if applicable)
4. Chapter 14A: Connected Transactions (disclosure requirements)
5. Appendix D1A: Contents of Listing Documents

EVALUATE:
- Required disclosures present?
- Risk factors adequately specific?
- Financial information complete?
- Director/management disclosures adequate?
- Forward-looking statements properly qualified?

Respond in JSON format:
{
  "isCompliant": boolean,
  "complianceScore": number (0-100),
  "issues": [
    {
      "rule": "specific rule reference (e.g., Rule 11.07)",
      "issue": "clear description of the compliance gap",
      "severity": "high" | "medium" | "low",
      "suggestion": "specific recommendation to fix"
    }
  ],
  "suggestedRevision": "improved text addressing all issues"
}`,
  
  translate: `You are a certified financial translator specializing in Hong Kong IPO prospectuses and securities documents.

TRANSLATION RULES:
1. Use formal business/legal register appropriate for securities disclosure
2. Maintain consistency with HKEX standard terminology
3. Preserve all numbers, dates, and proper nouns exactly
4. Keep company names in original form unless official translation exists
5. Use industry-standard translations for financial/legal terms

PRESERVE EXACTLY (do not translate):
- Company names and entity names (unless official translation known)
- Regulatory rule numbers (e.g., "Rule 8.05")
- Proper nouns and place names
${OUTPUT_FORMAT_RULES}`,
  
  formal: `You are a senior legal counsel at a Magic Circle law firm specializing in Hong Kong IPO prospectuses. Transform this text into formal securities disclosure language.

FORMAL STYLE REQUIREMENTS:
1. Use third person consistently ("The Company", "The Group", "The Directors" - NOT "We", "Our", "Us")
2. Use passive voice where appropriate for legal documents ("It is expected that..." not "We expect...")
3. Include precise qualifiers where appropriate ("approximately", "as at the Latest Practicable Date", "to the best of the Directors' knowledge")
4. Maintain professional distance and objectivity - no promotional language
5. Use formal transitions ("Furthermore,", "In addition,", "Accordingly,")
6. Use proper legal/financial terminology

PRESERVE EXACTLY - DO NOT CHANGE:
- All numbers, dates, percentages, and financial figures
- Company names, person names, and entity names
- Regulatory citations and rule references
- Technical and industry-specific terminology
- The factual content and meaning

LENGTH: Keep similar length to original (±15% words maximum)
${OUTPUT_FORMAT_RULES}`,
  
  custom: '' // Will be replaced with user's custom prompt
};

/**
 * Post-processing function to clean AI output for Word documents
 * Removes markdown formatting and common AI preambles
 */
function cleanOutputForWord(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let cleaned = text;
  
  // Remove markdown bold/italic
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  
  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove markdown bullet points (convert to simple bullet)
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '• ');
  
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove common AI preambles (case-insensitive, at start of text)
  const preamblePatterns = [
    /^(Okay|Sure|Certainly|Of course)[,.]?\s*(here('s| is)|I('ve| have))[^.]*[.!:]\s*/i,
    /^Here('s| is) (a |the )?(revised|improved|rewritten|formal|translated|summarized)[^.]*[.!:]\s*/i,
    /^I('ve| have) (revised|improved|rewritten|made|transformed)[^.]*[.!:]\s*/i,
    /^(The following|Below) (is|are)[^.]*[.!:]\s*/i,
    /^This (is a |)(revised|improved)[^.]*[.!:]\s*/i,
  ];
  
  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user session
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, selectedText, customPrompt, targetLanguage } = await req.json() as QuickActionRequest;

    if (!action || !selectedText) {
      return new Response(JSON.stringify({ error: 'Missing action or selectedText' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📝 Quick action: ${action} for user ${user.id}`);
    console.log(`📄 Text length: ${selectedText.length} characters`);

    // Build the prompt
    let systemPrompt = ACTION_PROMPTS[action] || ACTION_PROMPTS.custom;
    let userPrompt = selectedText;

    if (action === 'custom' && customPrompt) {
      systemPrompt = `You are an expert IPO prospectus editor following Hong Kong Stock Exchange Listing Rules standards.

The user will provide specific instructions. Follow them precisely while adhering to these NON-NEGOTIABLE RULES:

1. PRESERVE EXACTLY: All numbers, dates, percentages, names, and regulatory citations
2. MAINTAIN: Original structure and formatting
3. LENGTH: Keep similar to original unless user specifically requests longer/shorter
4. TONE: Professional, formal language suitable for securities disclosure
5. NEVER: Add speculative, promotional, or unsubstantiated claims
6. OUTPUT: Return ONLY the revised text - no explanations, preambles, or meta-commentary
${OUTPUT_FORMAT_RULES}

USER'S INSTRUCTION: ${customPrompt}

Process the following text according to the user's instruction:`;
      userPrompt = selectedText;
    }

    if (action === 'translate' && targetLanguage) {
      const langMap = { 'en': 'English', 'zh-TW': 'Traditional Chinese', 'zh-CN': 'Simplified Chinese' };
      systemPrompt += ` Translate to ${langMap[targetLanguage]}.`;
    }

    // Call Grok API with upgraded model
    const grokApiKey = Deno.env.get('GROK_API_KEY');
    if (!grokApiKey) {
      throw new Error('GROK_API_KEY not configured');
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 8000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Grok API error:', errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const resultText = aiResponse.choices?.[0]?.message?.content || '';

    console.log(`✅ Quick action completed, response length: ${resultText.length}`);

    // Parse compliance response specially
    if (action === 'compliance') {
      try {
        // Try to extract JSON from the response
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const complianceResult = JSON.parse(jsonMatch[0]);
          // Clean the suggested revision for Word
          const cleanedRevision = cleanOutputForWord(complianceResult.suggestedRevision || selectedText);
          return new Response(JSON.stringify({
            result: cleanedRevision,
            explanation: `Compliance Score: ${complianceResult.complianceScore}/100`,
            complianceNotes: complianceResult.issues?.map((i: any) => `[${i.severity?.toUpperCase() || 'INFO'}] ${i.rule}: ${i.issue}`) || [],
            isCompliant: complianceResult.isCompliant,
            fullAnalysis: complianceResult
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (parseError) {
        console.error('Failed to parse compliance JSON:', parseError);
      }
    }

    // Clean the result for Word (remove markdown and preambles)
    const cleanedResult = cleanOutputForWord(resultText);

    return new Response(JSON.stringify({
      result: cleanedResult,
      explanation: action === 'translate' ? `Translated to ${targetLanguage}` : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Quick action error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
