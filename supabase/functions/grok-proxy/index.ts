import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-type, x-cache-bust',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`🚀 Grok Proxy: ${req.method} ${req.url}`);
    
    // Verify authentication (JWT required)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Authenticated user: ${user.id}`);
    
    // Get the API key from Supabase environment
    const grokApiKey = Deno.env.get('GROK_API_KEY');
    if (!grokApiKey) {
      console.error('❌ No GROK_API_KEY found in environment');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse the request URL to get the endpoint
    const url = new URL(req.url);
    let targetPath = '';
    
    // Handle different endpoints
    if (url.pathname.includes('/chat/completions')) {
      targetPath = '/v1/chat/completions';
    } else if (url.pathname.includes('/models')) {
      targetPath = '/v1/models';
    } else {
      // Default to chat completions
      targetPath = '/v1/chat/completions';
    }

    const targetUrl = `https://api.x.ai${targetPath}`;
    console.log(`🎯 Proxying to: ${targetUrl}`);

    // Get request body for POST requests
    let requestBody = null;
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
        console.log(`📝 Request body model: ${requestBody?.model || 'not specified'}`);
      } catch (error) {
        console.error('❌ Error parsing request body:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Make the request to Grok API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    console.log(`📊 Grok API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Grok API error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: `Grok API error: ${response.status}`,
          details: errorText 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the response data
    const responseData = await response.json();
    console.log(`✅ Successful response from Grok API`);

    // Track API usage (async, don't wait)
    supabase.from('api_usage').insert({
      user_id: user.id,
      provider: 'grok',
      model_id: requestBody?.model || 'grok-beta',
      tokens_used: responseData?.usage?.total_tokens || 0,
      feature_context: 'grok-proxy',
    }).then(({ error }) => {
      if (error) console.warn('Failed to track API usage:', error);
    });

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Grok proxy error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal proxy error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});