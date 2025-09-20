import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  provider: 'grok' | 'google';
  model: string;
  prompt: string;
  feature?: string;
  sessionId?: string;
  metadata?: {
    maxTokens?: number;
    temperature?: number;
    requestType?: string;
  };
}

interface AIResponse {
  text: string;
  success: boolean;
  error?: string;
  tokensUsed: number;
  provider: string;
  model: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const request: AIRequest = await req.json();
    console.log('AI Request:', { provider: request.provider, model: request.model, userId: user.id });

    // Check user subscription and limits
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.tokens_used_this_month >= subscription.monthly_token_limit) {
      throw new Error('Monthly token limit exceeded');
    }

    // Get system API key for provider
    let apiKey: string;
    let response: AIResponse;

    if (request.provider === 'grok') {
      apiKey = Deno.env.get('GROK_API_KEY') ?? '';
      if (!apiKey) {
        throw new Error('Grok API key not configured');
      }
      try {
        response = await callGrokAPI(request, apiKey);
      } catch (error) {
        console.error('Grok API failed, trying Google fallback:', error);
        // Fallback to Google if Grok fails
        const googleApiKey = Deno.env.get('GOOGLE_API_KEY') ?? '';
        if (googleApiKey) {
          response = await callGoogleAPI({ ...request, provider: 'google', model: 'gemini-2.0-flash' }, googleApiKey);
        } else {
          throw error;
        }
      }
    } else if (request.provider === 'google') {
      apiKey = Deno.env.get('GOOGLE_API_KEY') ?? '';
      if (!apiKey) {
        throw new Error('Google API key not configured');
      }
      response = await callGoogleAPI(request, apiKey);
    } else {
      throw new Error(`Unsupported provider: ${request.provider}`);
    }

    if (response.success) {
      // Track usage in database
      await Promise.all([
        // Log API usage
        supabase.from('api_usage').insert({
          user_id: user.id,
          provider: request.provider,
          model_id: request.model,
          tokens_used: response.tokensUsed,
          request_count: 1,
          feature_context: request.feature || 'general',
          session_id: request.sessionId
        }),
        // Update subscription usage
        supabase
          .from('user_subscriptions')
          .update({
            tokens_used_this_month: subscription.tokens_used_this_month + response.tokensUsed
          })
          .eq('user_id', user.id)
      ]);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Universal AI Proxy Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        text: '',
        tokensUsed: 0,
        provider: '',
        model: ''
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function callGrokAPI(request: AIRequest, apiKey: string): Promise<AIResponse> {
  // Dynamic token allocation based on request type
  const isProfessionalDraft = request.metadata?.requestType === 'professional_draft_generation';
  const maxTokens = request.metadata?.maxTokens || (isProfessionalDraft ? 25000 : 4000);
  const temperature = request.metadata?.temperature || 0.3;

  console.log(`Grok API call - maxTokens: ${maxTokens}, temperature: ${temperature}, isProfessionalDraft: ${isProfessionalDraft}`);

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        { role: 'user', content: request.prompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const tokensUsed = data.usage?.total_tokens || 0;

  return {
    text,
    success: true,
    tokensUsed,
    provider: 'grok',
    model: request.model
  };
}

async function callGoogleAPI(request: AIRequest, apiKey: string): Promise<AIResponse> {
  // Dynamic token allocation based on request type
  const isProfessionalDraft = request.metadata?.requestType === 'professional_draft_generation';
  const maxOutputTokens = request.metadata?.maxTokens || (isProfessionalDraft ? 100000 : 4000);
  const temperature = request.metadata?.temperature || 0.4;

  console.log(`Google API call - maxOutputTokens: ${maxOutputTokens}, temperature: ${temperature}, isProfessionalDraft: ${isProfessionalDraft}`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: request.prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: temperature,
          topK: 32,
          topP: 1,
          maxOutputTokens: maxOutputTokens,
        }
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Google doesn't return token usage in the same way, estimate based on text length
  const tokensUsed = Math.ceil(text.length / 4); // Rough estimation

  return {
    text,
    success: true,
    tokensUsed,
    provider: 'google',
    model: request.model
  };
}