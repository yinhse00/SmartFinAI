import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string || `document-${Date.now()}.docx`;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Uploading temp document: ${filename}, size: ${file.size} bytes`);

    // Generate a unique path with timestamp for auto-cleanup identification
    const timestamp = Date.now();
    const uniquePath = `temp/${timestamp}-${filename}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('temp-documents')
      .upload(uniquePath, file, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload document', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Upload successful:', uploadData.path);

    // Generate a signed URL valid for 1 hour
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('temp-documents')
      .createSignedUrl(uniquePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate access URL', details: signedUrlError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generated signed URL for document');

    // Schedule cleanup after 1 hour (using background task)
    EdgeRuntime.waitUntil(
      (async () => {
        // Wait 1 hour before deleting
        await new Promise(resolve => setTimeout(resolve, 3600000));
        
        const { error: deleteError } = await supabase.storage
          .from('temp-documents')
          .remove([uniquePath]);
        
        if (deleteError) {
          console.error('Failed to cleanup temp document:', deleteError);
        } else {
          console.log('Cleaned up temp document:', uniquePath);
        }
      })()
    );

    return new Response(
      JSON.stringify({
        success: true,
        url: signedUrlData.signedUrl,
        path: uniquePath,
        expiresIn: 3600,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
