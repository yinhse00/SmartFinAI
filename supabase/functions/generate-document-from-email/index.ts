import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailContent, subject, projectId, sender } = await req.json();

    console.log('Generating document from email:', { subject, projectId, sender });

    // Get project context
    const { data: project } = await supabase
      .from('execution_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Call AI to analyze email and generate document
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
      'ai-execution-assistant',
      {
        body: {
          prompt: `
            Analyze this email request and generate an appropriate document:
            
            From: ${sender}
            Subject: ${subject}
            Content: ${emailContent}
            
            Project Context: ${JSON.stringify(project || {})}
            
            Determine the document type requested and generate content:
            
            Document types to consider:
            - Regulatory filing/response
            - Status report
            - Compliance checklist
            - Meeting minutes
            - Project update
            - Risk assessment
            - Legal opinion
            - Financial analysis
            
            Return JSON with:
            {
              "documentType": "type of document",
              "title": "Document title",
              "content": "Full document content in professional format",
              "metadata": {
                "createdFor": "sender email",
                "requestedVia": "email",
                "priority": "low|medium|high",
                "estimatedPages": number,
                "format": "docx|pdf|txt"
              }
            }
          `,
          context: { projectId, sender, documentGeneration: true }
        }
      }
    );

    if (aiError) {
      throw new Error(`AI document generation failed: ${aiError.message}`);
    }

    let documentData;
    try {
      documentData = JSON.parse(aiResponse.response);
    } catch (parseError) {
      console.error('Error parsing AI document response:', parseError);
      throw new Error('Failed to parse document generation response');
    }

    // Store the generated document
    const { data: docRecord, error: docError } = await supabase
      .from('execution_ai_documents')
      .insert({
        project_id: projectId,
        document_type: documentData.documentType,
        title: documentData.title,
        content: documentData.content,
        metadata: documentData.metadata,
        created_by_ai: true
      })
      .select()
      .single();

    if (docError) {
      console.error('Error storing document:', docError);
      throw new Error('Failed to store generated document');
    }

    // Create download URL (in a real implementation, you'd generate a file and upload to storage)
    const downloadUrl = `${supabaseUrl}/rest/v1/execution_ai_documents/${docRecord.id}/download`;

    console.log('Document generated successfully:', docRecord.id);

    return new Response(JSON.stringify({ 
      document: {
        id: docRecord.id,
        type: documentData.documentType,
        title: documentData.title,
        content: documentData.content,
        metadata: documentData.metadata
      },
      downloadUrl,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-document-from-email:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});