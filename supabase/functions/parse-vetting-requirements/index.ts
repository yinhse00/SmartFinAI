
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Import SheetJS for proper Excel parsing
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

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
    console.log('Starting Excel parsing process with proper SheetJS library...');
    
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

    // Convert blob to ArrayBuffer for Excel parsing
    const arrayBuffer = await fileBlob.arrayBuffer()
    
    // Parse Excel content using SheetJS
    const requirements = await parseExcelWithSheetJS(arrayBuffer)
    
    if (requirements.length === 0) {
      throw new Error('No vetting requirements extracted from the Excel file. Please check the file format and content.')
    }

    console.log(`Successfully parsed ${requirements.length} vetting requirements from Excel file`);

    // Clear existing data and insert new data in a transaction-like approach
    const { error: deleteError } = await supabase
      .from('announcement_pre_vetting_requirements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      throw new Error('Failed to clear existing vetting requirements data')
    }

    console.log('Cleared existing data, inserting new requirements...');

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
        requirements: requirements.slice(0, 10), // Return first 10 as sample
        summary: {
          totalRecords: requirements.length,
          requiringVetting: requirements.filter(r => r.is_vetting_required).length,
          notRequiringVetting: requirements.filter(r => !r.is_vetting_required).length
        }
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
        error: error.message,
        details: 'Check the Edge Function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function parseExcelWithSheetJS(arrayBuffer: ArrayBuffer): Promise<VettingRequirement[]> {
  try {
    console.log('Parsing Excel file with SheetJS...');
    
    // Parse the Excel workbook
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    console.log('Workbook parsed, sheet names:', workbook.SheetNames);
    
    // Get the first worksheet (or find the one with vetting data)
    let worksheet = null;
    let sheetName = '';
    
    // Try to find the sheet with vetting requirements
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
      
      // Look for header indicators in first few rows
      for (let row = 0; row <= Math.min(10, range.e.r); row++) {
        const cellA = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
        const cellB = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
        
        if (cellA && cellB) {
          const textA = String(cellA.v || '').toLowerCase();
          const textB = String(cellB.v || '').toLowerCase();
          
          if ((textA.includes('headline') || textA.includes('category') || textA.includes('announcement')) &&
              (textB.includes('pre-vetting') || textB.includes('vetting') || textB.includes('requirement'))) {
            worksheet = sheet;
            sheetName = name;
            console.log(`Found vetting data in sheet: ${name} at row ${row}`);
            break;
          }
        }
      }
      
      if (worksheet) break;
    }
    
    // If no specific sheet found, use the first one
    if (!worksheet) {
      sheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[sheetName];
      console.log(`Using first sheet: ${sheetName}`);
    }
    
    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    }) as string[][];
    
    console.log(`Sheet data rows: ${jsonData.length}`);
    
    // Find the header row
    let headerRowIndex = -1;
    let columnMapping = {
      category: -1,
      vetting: -1,
      reference: -1,
      exemptions: -1,
      description: -1
    };
    
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
      const row = jsonData[i];
      if (!row || row.length < 2) continue;
      
      // Check if this looks like a header row
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase().trim();
        
        if (cell.includes('headline') && (cell.includes('category') || cell.includes('type'))) {
          columnMapping.category = j;
          headerRowIndex = i;
        }
        if (cell.includes('pre-vetting') || (cell.includes('vetting') && cell.includes('requirement'))) {
          columnMapping.vetting = j;
          headerRowIndex = i;
        }
        if (cell.includes('rule') && cell.includes('reference')) {
          columnMapping.reference = j;
        }
        if (cell.includes('exemption')) {
          columnMapping.exemptions = j;
        }
        if (cell.includes('description') || cell.includes('note')) {
          columnMapping.description = j;
        }
      }
      
      // If we found both category and vetting columns, we found the header
      if (columnMapping.category >= 0 && columnMapping.vetting >= 0) {
        console.log(`Found header row at index ${headerRowIndex}:`, columnMapping);
        break;
      }
    }
    
    if (headerRowIndex === -1 || columnMapping.category === -1 || columnMapping.vetting === -1) {
      console.warn('Could not find proper header row, attempting to parse from row 0');
      headerRowIndex = 0;
      columnMapping = { category: 0, vetting: 1, reference: 2, exemptions: 3, description: 4 };
    }
    
    const requirements: VettingRequirement[] = [];
    
    // Process data rows starting after the header
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      const categoryText = String(row[columnMapping.category] || '').trim();
      if (!categoryText || categoryText.length < 2) continue;
      
      // Skip rows that look like headers or separators
      if (categoryText.toLowerCase().includes('headline') ||
          categoryText.toLowerCase().includes('category') ||
          categoryText.toLowerCase().includes('announcement type') ||
          categoryText === '---' ||
          categoryText.startsWith('#')) {
        continue;
      }
      
      const vettingText = String(row[columnMapping.vetting] || '').toLowerCase().trim();
      const isVettingRequired = vettingText.includes('yes') || 
                                vettingText.includes('required') || 
                                vettingText.includes('pre') ||
                                vettingText === 'y';
      
      const ruleReference = columnMapping.reference >= 0 ? 
        String(row[columnMapping.reference] || '').trim() : undefined;
      const exemptions = columnMapping.exemptions >= 0 ? 
        String(row[columnMapping.exemptions] || '').trim() : undefined;
      const description = columnMapping.description >= 0 ? 
        String(row[columnMapping.description] || '').trim() : undefined;
      
      const requirement: VettingRequirement = {
        headline_category: categoryText,
        is_vetting_required: isVettingRequired,
        rule_reference: ruleReference && ruleReference.length > 1 ? ruleReference : undefined,
        exemptions: exemptions && exemptions.length > 1 ? exemptions : undefined,
        description: description && description.length > 1 ? description : undefined
      };
      
      requirements.push(requirement);
      console.log(`Row ${i}: ${categoryText} - ${isVettingRequired ? 'Pre-vetting required' : 'Post-vetting only'}`);
    }
    
    console.log(`Successfully extracted ${requirements.length} vetting requirements`);
    return requirements;
    
  } catch (error) {
    console.error('Error parsing Excel with SheetJS:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}
