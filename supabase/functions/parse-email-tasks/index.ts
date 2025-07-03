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
    const { emailContent, subject, projectId } = await req.json();

    console.log('Parsing email for tasks:', { subject, projectId });

    // Call AI to analyze email and extract tasks
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
      'ai-execution-assistant',
      {
        body: {
          prompt: `
            Analyze this email and extract any task creation requests or action items:
            
            Subject: ${subject}
            Content: ${emailContent}
            
            Look for:
            - Explicit task requests
            - Action items
            - Deadlines mentioned
            - Assignments to team members
            - Document requests
            - Meeting scheduling requests
            
            Return a JSON array of tasks with this structure:
            [
              {
                "title": "Task title",
                "description": "Detailed description", 
                "priority": "low|medium|high|critical",
                "type": "regulatory|financial|legal|operational",
                "estimatedDays": number,
                "stakeholders": ["email1", "email2"],
                "dependencies": [],
                "documents": ["doc1", "doc2"],
                "dueDate": "YYYY-MM-DD" (if mentioned)
              }
            ]
            
            If no tasks are found, return an empty array.
          `,
          context: { projectId, emailAnalysis: true }
        }
      }
    );

    if (aiError) {
      console.error('AI analysis error:', aiError);
      return new Response(JSON.stringify({ tasks: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let tasks = [];
    try {
      // Try to parse AI response as JSON
      const aiResponseData = JSON.parse(aiResponse.response);
      tasks = Array.isArray(aiResponseData) ? aiResponseData : [];
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      tasks = [];
    }

    console.log(`Extracted ${tasks.length} tasks from email`);

    return new Response(JSON.stringify({ 
      tasks,
      totalFound: tasks.length,
      source: 'ai_analysis'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-email-tasks:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      tasks: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});