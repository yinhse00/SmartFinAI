
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
    console.log('Starting comprehensive Excel parsing to extract ALL data...');
    
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
    
    // Parse Excel content with comprehensive data extraction
    const requirements = await parseCompleteExcelData(arrayBuffer)
    
    if (requirements.length === 0) {
      throw new Error('No vetting requirements extracted from the Excel file. Please check the file format and content.')
    }

    console.log(`Successfully parsed ${requirements.length} vetting requirements from Excel file`);

    // Clear existing data and insert new data
    const { error: deleteError } = await supabase
      .from('announcement_pre_vetting_requirements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      throw new Error('Failed to clear existing vetting requirements data')
    }

    console.log('Cleared existing data, inserting new requirements...');

    // Insert new requirements in batches
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < requirements.length; i += batchSize) {
      const batch = requirements.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('announcement_pre_vetting_requirements')
        .insert(batch)

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        throw new Error(`Failed to insert vetting requirements batch: ${insertError.message}`)
      }
      
      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, total inserted: ${insertedCount}`);
    }

    console.log('Successfully inserted all vetting requirements');

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
        },
        processingDetails: {
          fileSize: fileBlob.size,
          extractionMethod: 'Complete SheetJS parsing with comprehensive data extraction',
          dataValidation: 'Full field mapping and data cleaning applied'
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

async function parseCompleteExcelData(arrayBuffer: ArrayBuffer): Promise<VettingRequirement[]> {
  try {
    console.log('Starting complete Excel data extraction...');
    
    // Parse the Excel workbook
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
      raw: false
    });
    
    console.log('Workbook parsed. Sheet names:', workbook.SheetNames);
    
    // Find the main data sheet
    let targetWorksheet = null;
    let targetSheetName = '';
    
    // Look for the main data sheet (usually the first substantial one)
    for (const sheetName of workbook.SheetNames) {
      console.log(`Examining sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      
      // Check if sheet has substantial content (more than 20 rows and at least 2 columns)
      if (range.e.r > 20 && range.e.c >= 1) {
        targetWorksheet = worksheet;
        targetSheetName = sheetName;
        console.log(`Using sheet: ${sheetName} with ${range.e.r + 1} rows and ${range.e.c + 1} columns`);
        break;
      }
    }
    
    if (!targetWorksheet) {
      throw new Error('No suitable worksheet found in the Excel file');
    }
    
    // Convert the entire worksheet to JSON array
    const jsonData = XLSX.utils.sheet_to_json(targetWorksheet, { 
      header: 1,
      defval: '',
      raw: false,
      blankrows: false
    }) as string[][];
    
    console.log(`Sheet contains ${jsonData.length} rows of data`);
    
    // Find the header row and column indices
    const columnMapping = findHeaderRowAndColumns(jsonData);
    console.log('Detected column mapping:', columnMapping);
    
    if (columnMapping.headerRowIndex === -1) {
      throw new Error('Could not identify header row in the Excel file');
    }
    
    // Extract all data rows
    const requirements: VettingRequirement[] = [];
    const startRow = columnMapping.headerRowIndex + 1;
    
    console.log(`Processing data from row ${startRow} to ${jsonData.length}`);
    
    for (let i = startRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      // Extract and clean the headline category
      const categoryText = cleanText(row[columnMapping.categoryColumn]);
      if (!categoryText || categoryText.length < 3) continue;
      
      // Skip header-like rows
      if (isHeaderOrSeparatorRow(categoryText)) continue;
      
      // Extract vetting requirement
      const vettingText = cleanText(row[columnMapping.vettingColumn]);
      const isVettingRequired = determineVettingRequirement(vettingText);
      
      // Extract additional fields if available
      const ruleReference = columnMapping.referenceColumn >= 0 ? 
        cleanText(row[columnMapping.referenceColumn]) : undefined;
      const exemptions = columnMapping.exemptionsColumn >= 0 ? 
        cleanText(row[columnMapping.exemptionsColumn]) : undefined;
      const description = columnMapping.descriptionColumn >= 0 ? 
        cleanText(row[columnMapping.descriptionColumn]) : undefined;
      
      const requirement: VettingRequirement = {
        headline_category: categoryText,
        is_vetting_required: isVettingRequired,
        rule_reference: ruleReference && ruleReference.length > 2 ? ruleReference : undefined,
        exemptions: exemptions && exemptions.length > 2 ? exemptions : undefined,
        description: description && description.length > 2 ? description : undefined
      };
      
      requirements.push(requirement);
      
      // Log progress every 50 entries
      if (requirements.length % 50 === 0) {
        console.log(`Processed ${requirements.length} requirements so far...`);
      }
    }
    
    console.log(`Successfully extracted ${requirements.length} vetting requirements`);
    
    // Log sample of extracted data
    console.log('Sample extracted requirements:');
    requirements.slice(0, 5).forEach((req, index) => {
      console.log(`${index + 1}. ${req.headline_category} - ${req.is_vetting_required ? 'Vetting Required' : 'No Vetting'}`);
    });
    
    return requirements;
    
  } catch (error) {
    console.error('Error in complete Excel parsing:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

function findHeaderRowAndColumns(data: string[][]): {
  headerRowIndex: number;
  categoryColumn: number;
  vettingColumn: number;
  referenceColumn: number;
  exemptionsColumn: number;
  descriptionColumn: number;
} {
  let headerRowIndex = -1;
  let categoryColumn = -1;
  let vettingColumn = -1;
  let referenceColumn = -1;
  let exemptionsColumn = -1;
  let descriptionColumn = -1;
  
  // Search for header row in first 30 rows
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    // Check each column for header indicators
    for (let j = 0; j < row.length; j++) {
      const cellText = String(row[j] || '').toLowerCase().trim();
      
      // Detect category column
      if (cellText.includes('headline') && cellText.includes('category') ||
          cellText.includes('announcement') && cellText.includes('type') ||
          cellText.includes('category') ||
          cellText === 'headline category') {
        categoryColumn = j;
        headerRowIndex = i;
      }
      
      // Detect vetting requirement column
      if (cellText.includes('pre-vetting') || 
          cellText.includes('vetting') && cellText.includes('requirement') ||
          cellText.includes('pre vetting') ||
          cellText === 'pre-vetting requirement' ||
          cellText.includes('y/n') ||
          cellText.includes('yes/no')) {
        vettingColumn = j;
        headerRowIndex = i;
      }
      
      // Detect reference column
      if (cellText.includes('rule') && cellText.includes('reference') ||
          cellText.includes('reference') ||
          cellText.includes('rule no')) {
        referenceColumn = j;
      }
      
      // Detect exemptions column
      if (cellText.includes('exemption') || cellText.includes('exception')) {
        exemptionsColumn = j;
      }
      
      // Detect description column
      if (cellText.includes('description') || 
          cellText.includes('note') || 
          cellText.includes('remark') ||
          cellText.includes('comment')) {
        descriptionColumn = j;
      }
    }
    
    // If we found both essential columns, we have our header row
    if (categoryColumn >= 0 && vettingColumn >= 0) {
      console.log(`Header row detected at index ${headerRowIndex}`);
      break;
    }
  }
  
  // Fallback if specific headers not found
  if (headerRowIndex === -1 && data.length > 0) {
    console.log('Using fallback column assignment');
    headerRowIndex = 0;
    categoryColumn = 0;
    vettingColumn = 1;
    referenceColumn = data[0].length > 2 ? 2 : -1;
    exemptionsColumn = data[0].length > 3 ? 3 : -1;
    descriptionColumn = data[0].length > 4 ? 4 : -1;
  }
  
  return {
    headerRowIndex,
    categoryColumn,
    vettingColumn,
    referenceColumn,
    exemptionsColumn,
    descriptionColumn
  };
}

function cleanText(cell: any): string {
  if (cell === null || cell === undefined) return '';
  
  const text = String(cell).trim();
  
  // Remove common Excel artifacts and normalize
  return text
    .replace(/^\"|\"$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\r\n]+/g, ' ') // Replace line breaks with spaces
    .trim();
}

function determineVettingRequirement(vettingText: string): boolean {
  if (!vettingText) return false;
  
  const text = vettingText.toLowerCase().trim();
  
  // Positive indicators for vetting required
  const positiveKeywords = ['yes', 'y', 'required', 'pre-vetting', 'pre vetting', 'mandatory', 'needed', 'applicable'];
  const negativeKeywords = ['no', 'n', 'not required', 'not applicable', 'na', 'n/a', 'none', 'nil', 'exempt'];
  
  // Check for positive indicators first
  if (positiveKeywords.some(keyword => text.includes(keyword))) {
    return true;
  }
  
  // Check for negative indicators
  if (negativeKeywords.some(keyword => text.includes(keyword))) {
    return false;
  }
  
  // Default to requiring vetting if unclear
  return true;
}

function isHeaderOrSeparatorRow(categoryText: string): boolean {
  const text = categoryText.toLowerCase();
  
  // Skip obvious header rows
  if (text.includes('headline') || 
      text.includes('category') || 
      text.includes('announcement') ||
      text.includes('type')) {
    return true;
  }
  
  // Skip separator rows
  if (text === '---' || 
      text.startsWith('#') || 
      text.length < 3 ||
      /^[\-_=\s]+$/.test(text)) {
    return true;
  }
  
  return false;
}
