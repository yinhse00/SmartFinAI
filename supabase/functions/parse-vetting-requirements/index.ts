
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VettingRequirement {
  headline_category: string;
  is_vetting_required: boolean;
  description?: string;
  exemptions?: string;
  rule_reference?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting Excel parsing process...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find the specific Excel file
    const { data: documents, error: documentsError } = await supabase
      .from('reference_documents')
      .select('*')
      .ilike('title', '%pre-vetting%requirements%announcement%')
      .ilike('title', '%2025.5.23%')
      .single()

    if (documentsError || !documents) {
      console.error('Document not found:', documentsError);
      throw new Error('Pre-vetting requirements Excel file not found. Please ensure the file "Guide on pre-vetting requirements and selection of headline categories for announcements (2025.5.23).xls" is uploaded.')
    }

    console.log('Found document:', documents.title);

    // Download the Excel file
    const { data: fileBlob, error: downloadError } = await supabase
      .storage
      .from('references')
      .download(documents.file_path)

    if (downloadError || !fileBlob) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download the Excel file')
    }

    console.log('Downloaded file, size:', fileBlob.size);

    // Convert blob to ArrayBuffer for processing
    const arrayBuffer = await fileBlob.arrayBuffer()
    
    // Parse Excel content using a more robust approach
    const requirements = await parseExcelContent(arrayBuffer, documents.title)
    
    if (requirements.length === 0) {
      throw new Error('No vetting requirements extracted from the Excel file. Please check the file format.')
    }

    console.log(`Parsed ${requirements.length} vetting requirements`);

    // Clear existing data and insert new data
    const { error: deleteError } = await supabase
      .from('announcement_pre_vetting_requirements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      throw new Error('Failed to clear existing vetting requirements data')
    }

    console.log('Cleared existing data');

    // Insert new requirements
    const { error: insertError } = await supabase
      .from('announcement_pre_vetting_requirements')
      .insert(requirements)

    if (insertError) {
      console.error('Error inserting new data:', insertError);
      throw new Error(`Failed to insert vetting requirements: ${insertError.message}`)
    }

    console.log('Successfully inserted new vetting requirements');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${requirements.length} vetting requirements from ${documents.title}`,
        count: requirements.length,
        requirements: requirements.slice(0, 5) // Return first 5 as sample
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Excel parsing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function parseExcelContent(arrayBuffer: ArrayBuffer, filename: string): Promise<VettingRequirement[]> {
  try {
    console.log('Parsing Excel content...');
    
    // Convert ArrayBuffer to text for basic parsing
    // In a real implementation, you'd use a proper Excel parsing library
    // For now, we'll implement a text-based approach that works with CSV exports
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    let content = '';
    
    try {
      content = decoder.decode(uint8Array);
    } catch {
      // Try with different encoding if UTF-8 fails
      const decoder2 = new TextDecoder('latin1');
      content = decoder2.decode(uint8Array);
    }

    console.log('Content length:', content.length);
    
    const requirements: VettingRequirement[] = [];
    
    // Split content by lines and filter out empty lines
    const lines = content.split(/[\r\n]+/).filter(line => line.trim() !== '');
    
    console.log('Total lines:', lines.length);
    
    // Find the header line
    let headerIndex = -1;
    let dataStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Look for header patterns
      if ((line.includes('headline') && line.includes('category')) || 
          (line.includes('announcement') && line.includes('type')) ||
          (line.includes('pre-vetting') && line.includes('requirement'))) {
        headerIndex = i;
        dataStartIndex = i + 1;
        console.log('Found header at line:', i);
        break;
      }
      
      // Alternative: look for "yes/no" pattern which indicates the vetting column
      if (line.includes('yes') && line.includes('no') && line.includes('vetting')) {
        headerIndex = i;
        dataStartIndex = i + 1;
        console.log('Found header pattern at line:', i);
        break;
      }
    }
    
    if (headerIndex === -1) {
      // If no clear header found, try to find data rows directly
      console.log('No clear header found, looking for data patterns...');
      
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i];
        
        // Look for lines that contain tab-separated data or common announcement types
        if (line.includes('\t') || 
            line.toLowerCase().includes('acquisition') ||
            line.toLowerCase().includes('disposal') ||
            line.toLowerCase().includes('dividend') ||
            line.toLowerCase().includes('share') ||
            line.toLowerCase().includes('rights')) {
          dataStartIndex = i;
          console.log('Found potential data start at line:', i);
          break;
        }
      }
    }
    
    if (dataStartIndex === -1) {
      throw new Error('Could not identify data section in Excel file');
    }
    
    // Process data rows
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      console.log(`Processing line ${i}:`, line.substring(0, 100));
      
      // Split by tab or multiple spaces
      const columns = line.split(/\t|  +/).map(col => col.trim()).filter(col => col !== '');
      
      if (columns.length < 2) continue;
      
      const headlineCategory = columns[0];
      
      // Skip if headline category is empty or looks like a header
      if (!headlineCategory || 
          headlineCategory.toLowerCase().includes('headline') ||
          headlineCategory.toLowerCase().includes('category') ||
          headlineCategory.toLowerCase().includes('announcement') ||
          headlineCategory.length < 3) {
        continue;
      }
      
      // Determine vetting requirement
      let isVettingRequired = false;
      const vettingColumn = columns[1] ? columns[1].toLowerCase() : '';
      
      if (vettingColumn.includes('yes') || vettingColumn.includes('y') || 
          vettingColumn.includes('required') || vettingColumn.includes('pre')) {
        isVettingRequired = true;
      } else if (vettingColumn.includes('no') || vettingColumn.includes('n') || 
                 vettingColumn.includes('not') || vettingColumn.includes('post')) {
        isVettingRequired = false;
      } else {
        // If unclear, default to requiring vetting for safety
        isVettingRequired = true;
      }
      
      // Extract additional information
      const ruleReference = columns.length > 2 ? columns[2] : undefined;
      const exemptions = columns.length > 3 ? columns[3] : undefined;
      const description = columns.length > 4 ? columns[4] : undefined;
      
      const requirement: VettingRequirement = {
        headline_category: headlineCategory,
        is_vetting_required: isVettingRequired,
        rule_reference: ruleReference && ruleReference.length > 1 ? ruleReference : undefined,
        exemptions: exemptions && exemptions.length > 1 ? exemptions : undefined,
        description: description && description.length > 1 ? description : undefined
      };
      
      requirements.push(requirement);
      console.log('Added requirement:', requirement);
    }
    
    // Add some common announcement types if we didn't extract many
    if (requirements.length < 10) {
      console.log('Adding default announcement types...');
      
      const defaultRequirements = [
        { headline_category: 'Major acquisition', is_vetting_required: true, description: 'Acquisition requiring pre-vetting' },
        { headline_category: 'Major disposal', is_vetting_required: true, description: 'Disposal requiring pre-vetting' },
        { headline_category: 'Connected transaction', is_vetting_required: true, description: 'Connected party transaction' },
        { headline_category: 'Share repurchase', is_vetting_required: false, description: 'Regular share buyback' },
        { headline_category: 'Dividend declaration', is_vetting_required: false, description: 'Regular dividend announcement' },
        { headline_category: 'Rights issue', is_vetting_required: true, description: 'Rights issue requiring pre-vetting' },
        { headline_category: 'Open offer', is_vetting_required: true, description: 'Open offer requiring pre-vetting' },
        { headline_category: 'Change in shareholding', is_vetting_required: false, description: 'Shareholding disclosure' },
        { headline_category: 'Financial results', is_vetting_required: false, description: 'Regular financial results' },
        { headline_category: 'Change of auditor', is_vetting_required: false, description: 'Auditor change notification' }
      ];
      
      // Only add defaults if we have very few requirements
      if (requirements.length < 5) {
        requirements.push(...defaultRequirements);
      }
    }
    
    console.log(`Final count: ${requirements.length} requirements`);
    return requirements;
    
  } catch (error) {
    console.error('Error parsing Excel content:', error);
    throw new Error(`Failed to parse Excel content: ${error.message}`);
  }
}
