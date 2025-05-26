
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
    console.log('Starting enhanced Excel parsing with SheetJS library...');
    
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
    
    // Parse Excel content using enhanced SheetJS implementation
    const requirements = await parseExcelWithEnhancedSheetJS(arrayBuffer)
    
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

    // Insert new requirements in batches to handle large datasets
    const batchSize = 100;
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
        requirements: requirements.slice(0, 15), // Return first 15 as sample
        summary: {
          totalRecords: requirements.length,
          requiringVetting: requirements.filter(r => r.is_vetting_required).length,
          notRequiringVetting: requirements.filter(r => !r.is_vetting_required).length
        },
        processingDetails: {
          fileSize: fileBlob.size,
          extractionMethod: 'Enhanced SheetJS with comprehensive parsing',
          dataValidation: 'Complete with field mapping and cleaning'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Enhanced Excel parsing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Check the Edge Function logs for more information',
        troubleshooting: {
          suggestion: 'Verify the Excel file format and ensure it contains the expected vetting requirements data',
          expectedStructure: 'Columns should include: Headline Category, Pre-vetting Requirement, Rule Reference, Exemptions'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function parseExcelWithEnhancedSheetJS(arrayBuffer: ArrayBuffer): Promise<VettingRequirement[]> {
  try {
    console.log('Starting enhanced Excel parsing with comprehensive data extraction...');
    
    // Parse the Excel workbook with enhanced options
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
      raw: false,
      codepage: 65001 // UTF-8 for better character support
    });
    
    console.log('Workbook parsed successfully. Sheet names:', workbook.SheetNames);
    
    // Find the worksheet containing vetting requirements data
    let targetWorksheet = null;
    let targetSheetName = '';
    
    // Look for sheets with vetting-related content
    for (const sheetName of workbook.SheetNames) {
      console.log(`Examining sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert a small portion to check content
      const testRange = { s: { c: 0, r: 0 }, e: { c: 10, r: 20 } }; // First 10 columns, 20 rows
      const testData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        range: testRange,
        defval: '',
        raw: false
      }) as string[][];
      
      // Look for vetting-related keywords in the sheet
      const hasVettingContent = testData.some(row => 
        row.some(cell => {
          const cellText = String(cell || '').toLowerCase();
          return cellText.includes('vetting') || 
                 cellText.includes('headline') || 
                 cellText.includes('category') || 
                 cellText.includes('announcement') ||
                 cellText.includes('pre-vetting') ||
                 cellText.includes('requirement');
        })
      );
      
      if (hasVettingContent) {
        targetWorksheet = worksheet;
        targetSheetName = sheetName;
        console.log(`Found target sheet with vetting content: ${sheetName}`);
        break;
      }
    }
    
    // If no specific sheet found, use the first substantial sheet
    if (!targetWorksheet) {
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        
        // Check if sheet has substantial content
        if (range.e.r > 10 && range.e.c > 1) {
          targetWorksheet = worksheet;
          targetSheetName = sheetName;
          console.log(`Using first substantial sheet: ${sheetName}`);
          break;
        }
      }
    }
    
    if (!targetWorksheet) {
      throw new Error('No suitable worksheet found in the Excel file');
    }
    
    // Convert the entire worksheet to JSON for comprehensive analysis
    const fullData = XLSX.utils.sheet_to_json(targetWorksheet, { 
      header: 1,
      defval: '',
      raw: false,
      blankrows: false
    }) as string[][];
    
    console.log(`Sheet contains ${fullData.length} rows of data`);
    
    // Advanced header detection and column mapping
    const columnMapping = detectColumnsAndHeaders(fullData);
    console.log('Detected column mapping:', columnMapping);
    
    if (columnMapping.headerRowIndex === -1) {
      throw new Error('Could not identify header row in the Excel file');
    }
    
    // Extract and process all data rows
    const requirements: VettingRequirement[] = [];
    const startRow = columnMapping.headerRowIndex + 1;
    
    console.log(`Processing data from row ${startRow} to ${fullData.length}`);
    
    for (let i = startRow; i < fullData.length; i++) {
      const row = fullData[i];
      if (!row || row.length === 0) continue;
      
      // Extract and clean the headline category
      const categoryText = extractAndCleanText(row[columnMapping.categoryColumn]);
      if (!categoryText || categoryText.length < 2) continue;
      
      // Skip obvious header or separator rows
      if (isHeaderOrSeparatorRow(categoryText)) continue;
      
      // Extract vetting requirement
      const vettingText = extractAndCleanText(row[columnMapping.vettingColumn]);
      const isVettingRequired = parseVettingRequirement(vettingText);
      
      // Extract additional fields
      const ruleReference = columnMapping.referenceColumn >= 0 ? 
        extractAndCleanText(row[columnMapping.referenceColumn]) : undefined;
      const exemptions = columnMapping.exemptionsColumn >= 0 ? 
        extractAndCleanText(row[columnMapping.exemptionsColumn]) : undefined;
      const description = columnMapping.descriptionColumn >= 0 ? 
        extractAndCleanText(row[columnMapping.descriptionColumn]) : undefined;
      
      const requirement: VettingRequirement = {
        headline_category: categoryText,
        is_vetting_required: isVettingRequired,
        rule_reference: ruleReference && ruleReference.length > 2 ? ruleReference : undefined,
        exemptions: exemptions && exemptions.length > 2 ? exemptions : undefined,
        description: description && description.length > 2 ? description : undefined
      };
      
      requirements.push(requirement);
      
      // Log every 20th entry for monitoring
      if (requirements.length % 20 === 0) {
        console.log(`Processed ${requirements.length} requirements so far...`);
      }
    }
    
    console.log(`Successfully extracted ${requirements.length} vetting requirements`);
    
    // Validate extracted data
    if (requirements.length === 0) {
      throw new Error('No valid vetting requirements found in the Excel file');
    }
    
    // Log sample of extracted data for verification
    console.log('Sample extracted requirements:');
    requirements.slice(0, 5).forEach((req, index) => {
      console.log(`${index + 1}. ${req.headline_category} - ${req.is_vetting_required ? 'Vetting Required' : 'No Vetting'}`);
    });
    
    return requirements;
    
  } catch (error) {
    console.error('Error in enhanced Excel parsing:', error);
    throw new Error(`Failed to parse Excel file with enhanced SheetJS: ${error.message}`);
  }
}

function detectColumnsAndHeaders(data: string[][]): {
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
  
  // Search for header row in first 25 rows
  for (let i = 0; i < Math.min(25, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    // Check each column for header indicators
    for (let j = 0; j < row.length; j++) {
      const cellText = String(row[j] || '').toLowerCase().trim();
      
      // Detect category column
      if ((cellText.includes('headline') && cellText.includes('category')) ||
          (cellText.includes('announcement') && cellText.includes('type')) ||
          cellText.includes('category') ||
          cellText === 'headline category') {
        categoryColumn = j;
        headerRowIndex = i;
      }
      
      // Detect vetting requirement column
      if (cellText.includes('pre-vetting') || 
          (cellText.includes('vetting') && cellText.includes('requirement')) ||
          cellText.includes('pre vetting') ||
          cellText === 'pre-vetting requirement') {
        vettingColumn = j;
        headerRowIndex = i;
      }
      
      // Detect reference column
      if ((cellText.includes('rule') && cellText.includes('reference')) ||
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
  
  // Fallback column assignment if specific headers not found
  if (headerRowIndex === -1 && data.length > 0) {
    console.log('Using fallback column assignment');
    headerRowIndex = 0;
    categoryColumn = 0;
    vettingColumn = 1;
    referenceColumn = 2;
    exemptionsColumn = 3;
    descriptionColumn = 4;
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

function extractAndCleanText(cell: any): string {
  if (cell === null || cell === undefined) return '';
  
  const text = String(cell).trim();
  
  // Remove common Excel artifacts
  return text
    .replace(/^\"|\"$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\r\n]+/g, ' ') // Replace line breaks with spaces
    .trim();
}

function parseVettingRequirement(vettingText: string): boolean {
  if (!vettingText) return false;
  
  const text = vettingText.toLowerCase().trim();
  
  // Positive indicators for vetting required
  const positiveKeywords = ['yes', 'y', 'required', 'pre-vetting', 'pre vetting', 'mandatory', 'needed'];
  const negativeKeywords = ['no', 'n', 'not required', 'not applicable', 'na', 'n/a', 'none', 'nil'];
  
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
