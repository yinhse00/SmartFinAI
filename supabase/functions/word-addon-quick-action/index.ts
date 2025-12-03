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

const ACTION_PROMPTS: Record<QuickAction, string> = {
  improve: `You are an expert editor. Improve the following text for better grammar, clarity, and readability while maintaining the original meaning. Return ONLY the improved text, no explanations.`,
  
  summarize: `Summarize the following text concisely while preserving key information. Return ONLY the summary, no explanations.`,
  
  rewrite: `Rewrite the following text with alternative phrasing while maintaining the same meaning. Return ONLY the rewritten text, no explanations.`,
  
  compliance: `You are an HKEX Listing Rules compliance expert. Analyze the following IPO prospectus text for compliance with Hong Kong Stock Exchange requirements.

Check for:
1. Required disclosures under Main Board Listing Rules
2. Risk factor adequacy
3. Financial information requirements
4. Director/management disclosure requirements
5. Connected transaction disclosures
6. Use of proceeds clarity

Respond in JSON format:
{
  "isCompliant": boolean,
  "issues": [{"rule": "rule reference", "issue": "description", "suggestion": "how to fix"}],
  "suggestedRevision": "improved text if needed",
  "complianceScore": number (0-100)
}`,
  
  translate: `Translate the following text accurately. Maintain professional/formal tone appropriate for IPO prospectus documents. Return ONLY the translation, no explanations.`,
  
  formal: `Rewrite the following text in a more formal, professional tone suitable for IPO prospectus documents. Return ONLY the formal version, no explanations.`,
  
  custom: '' // Will be replaced with user's custom prompt
};

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
      systemPrompt = `You are an expert assistant for IPO prospectus documents. Follow the user's instructions precisely.`;
      userPrompt = `${customPrompt}\n\nText to process:\n${selectedText}`;
    }

    if (action === 'translate' && targetLanguage) {
      const langMap = { 'en': 'English', 'zh-TW': 'Traditional Chinese', 'zh-CN': 'Simplified Chinese' };
      systemPrompt += ` Translate to ${langMap[targetLanguage]}.`;
    }

    // Call Grok API
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
        model: 'grok-3-mini-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: action === 'compliance' ? 0.3 : 0.5,
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
          return new Response(JSON.stringify({
            result: complianceResult.suggestedRevision || selectedText,
            explanation: `Compliance Score: ${complianceResult.complianceScore}/100`,
            complianceNotes: complianceResult.issues?.map((i: any) => `${i.rule}: ${i.issue}`) || [],
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

    return new Response(JSON.stringify({
      result: resultText,
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
