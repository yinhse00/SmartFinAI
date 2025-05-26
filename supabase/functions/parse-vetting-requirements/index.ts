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
    console.log('Starting enhanced Excel parsing with improved column detection...');
    
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
    
    // Parse Excel content with enhanced data extraction
    const requirements = await parseExcelWithImprovedDetection(arrayBuffer)
    
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
          extractionMethod: 'Enhanced column detection with flexible mapping',
          dataValidation: 'Improved field mapping and data cleaning applied'
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

async function parseExcelWithImprovedDetection(arrayBuffer: ArrayBuffer): Promise<VettingRequirement[]> {
  try {
    console.log('Starting enhanced Excel parsing with improved column detection...');
    
    // Parse the Excel workbook
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
      raw: false
    });
    
    console.log('Workbook parsed. Sheet names:', workbook.SheetNames);
    
    // Find the main data sheet (prefer "Table" sheet)
    let targetWorksheet = null;
    let targetSheetName = '';
    
    // First try to find "Table" sheet specifically
    if (workbook.Sheets['Table']) {
      targetWorksheet = workbook.Sheets['Table'];
      targetSheetName = 'Table';
      console.log('Using "Table" sheet as primary data source');
    } else {
      // Fallback to first substantial sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        
        if (range.e.r > 10 && range.e.c >= 2) {
          targetWorksheet = worksheet;
          targetSheetName = sheetName;
          console.log(`Using fallback sheet: ${sheetName}`);
          break;
        }
      }
    }
    
    if (!targetWorksheet) {
      throw new Error('No suitable worksheet found in the Excel file');
    }
    
    // Convert the entire worksheet to JSON array with better options
    const jsonData = XLSX.utils.sheet_to_json(targetWorksheet, { 
      header: 1,
      defval: '',
      raw: false,
      blankrows: false
    }) as string[][];
    
    console.log(`Sheet "${targetSheetName}" contains ${jsonData.length} rows of data`);
    
    // Debug: Log first few rows to understand structure
    console.log('First 5 rows of data:');
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      console.log(`Row ${i}:`, jsonData[i]);
    }
    
    // Enhanced column detection with multiple strategies
    const columnMapping = detectColumnsWithMultipleStrategies(jsonData);
    console.log('Final column mapping:', columnMapping);
    
    if (columnMapping.headerRowIndex === -1 || columnMapping.categoryColumn === -1) {
      throw new Error('Could not identify required columns in the Excel file');
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
      if (!categoryText || categoryText.length < 2) continue;
      
      // Skip obvious header or separator rows
      if (isHeaderOrSeparatorRow(categoryText)) continue;
      
      // Extract vetting requirement with improved logic
      const vettingText = columnMapping.vettingColumn >= 0 ? 
        cleanText(row[columnMapping.vettingColumn]) : '';
      const isVettingRequired = determineVettingRequirement(vettingText, categoryText);
      
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
      
      // Log progress every 25 entries
      if (requirements.length % 25 === 0) {
        console.log(`Processed ${requirements.length} requirements so far...`);
      }
    }
    
    console.log(`Successfully extracted ${requirements.length} vetting requirements`);
    
    // Log sample of extracted data
    if (requirements.length > 0) {
      console.log('Sample extracted requirements:');
      requirements.slice(0, 3).forEach((req, index) => {
        console.log(`${index + 1}. "${req.headline_category}" - ${req.is_vetting_required ? 'Vetting Required' : 'No Vetting'}`);
      });
    }
    
    return requirements;
    
  } catch (error) {
    console.error('Error in enhanced Excel parsing:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

function detectColumnsWithMultipleStrategies(data: string[][]): {
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
  
  // Strategy 1: Look for exact header matches in first 10 rows
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    for (let j = 0; j < row.length; j++) {
      const cellText = String(row[j] || '').toLowerCase().trim();
      
      // More flexible category column detection
      if (categoryColumn === -1 && (
        cellText.includes('headline') ||
        cellText.includes('category') ||
        cellText.includes('announcement') ||
        cellText === 'type' ||
        cellText === 'categories'
      )) {
        categoryColumn = j;
        headerRowIndex = i;
        console.log(`Found category column at position ${j} in row ${i}: "${cellText}"`);
      }
      
      // Vetting requirement column detection
      if (vettingColumn === -1 && (
        cellText.includes('pre-vetting') ||
        cellText.includes('vetting') ||
        cellText.includes('y/n') ||
        cellText.includes('yes/no') ||
        cellText.includes('required')
      )) {
        vettingColumn = j;
        console.log(`Found vetting column at position ${j}: "${cellText}"`);
      }
      
      // Other columns
      if (referenceColumn === -1 && cellText.includes('reference')) {
        referenceColumn = j;
      }
      if (exemptionsColumn === -1 && cellText.includes('exemption')) {
        exemptionsColumn = j;
      }
      if (descriptionColumn === -1 && (cellText.includes('description') || cellText.includes('note'))) {
        descriptionColumn = j;
      }
    }
    
    // If we found the essential columns, we can stop
    if (categoryColumn >= 0 && headerRowIndex >= 0) {
      break;
    }
  }
  
  // Strategy 2: If no category column found, try positional approach
  if (categoryColumn === -1 && data.length > 3) {
    console.log('Using positional fallback for column detection');
    
    // Look for a column that contains varied text content (likely categories)
    for (let j = 0; j < Math.min(8, data[0]?.length || 0); j++) {
      let textCount = 0;
      let uniqueValues = new Set();
      
      // Check first 20 rows for this column
      for (let i = 2; i < Math.min(22, data.length); i++) {
        const cellValue = cleanText(data[i]?.[j] || '');
        if (cellValue && cellValue.length > 3 && !isHeaderOrSeparatorRow(cellValue)) {
          textCount++;
          uniqueValues.add(cellValue.toLowerCase());
        }
      }
      
      // If this column has diverse text content, it's likely the category column
      if (textCount > 5 && uniqueValues.size > 3) {
        categoryColumn = j;
        headerRowIndex = 2; // Assume header is in row 2
        console.log(`Found category column using positional analysis at column ${j}`);
        break;
      }
    }
  }
  
  // Strategy 3: Final fallback - use first column with substantial content
  if (categoryColumn === -1 && data.length > 2) {
    console.log('Using final fallback - first column with content');
    categoryColumn = 0;
    headerRowIndex = 2;
    
    // Try to find vetting column by looking for Y/N or similar patterns
    for (let j = 1; j < Math.min(8, data[0]?.length || 0); j++) {
      let yesNoCount = 0;
      for (let i = 3; i < Math.min(15, data.length); i++) {
        const cellValue = cleanText(data[i]?.[j] || '').toLowerCase();
        if (cellValue === 'y' || cellValue === 'n' || 
            cellValue === 'yes' || cellValue === 'no' ||
            cellValue.includes('required') || cellValue.includes('not required')) {
          yesNoCount++;
        }
      }
      
      if (yesNoCount > 3) {
        vettingColumn = j;
        console.log(`Found vetting column using pattern analysis at column ${j}`);
        break;
      }
    }
  }
  
  // Set default vetting column if not found
  if (vettingColumn === -1 && categoryColumn >= 0) {
    vettingColumn = Math.min(categoryColumn + 1, 7);
    console.log(`Using default vetting column at position ${vettingColumn}`);
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
    .replace(/[^\w\s\-\(\)\[\]\/\.,;:]/g, '') // Remove special characters but keep common punctuation
    .trim();
}

function determineVettingRequirement(vettingText: string, categoryText: string): boolean {
  if (!vettingText && !categoryText) return true; // Default to requiring vetting
  
  const text = vettingText.toLowerCase().trim();
  const category = categoryText.toLowerCase().trim();
  
  // Check vetting text first
  if (text) {
    // Positive indicators for vetting required
    if (/^(y|yes|required|pre-vetting|mandatory|needed|applicable)$/i.test(text)) {
      return true;
    }
    
    // Negative indicators for no vetting required
    if (/^(n|no|not\s+required|not\s+applicable|na|n\/a|none|nil|exempt)$/i.test(text)) {
      return false;
    }
  }
  
  // Analyze category text for patterns that suggest no vetting needed
  if (category.includes('general') || 
      category.includes('routine') || 
      category.includes('notification') ||
      category.includes('administrative')) {
    return false;
  }
  
  // For categories that typically require vetting
  if (category.includes('acquisition') || 
      category.includes('disposal') || 
      category.includes('transaction') ||
      category.includes('merger') ||
      category.includes('takeover')) {
    return true;
  }
  
  // Default to requiring vetting for safety
  return true;
}

function isHeaderOrSeparatorRow(categoryText: string): boolean {
  const text = categoryText.toLowerCase().trim();
  
  // Skip obvious header rows
  if (text.includes('headline') || 
      text.includes('category') || 
      text.includes('announcement') ||
      text.includes('type') ||
      text === 'categories') {
    return true;
  }
  
  // Skip separator rows
  if (text === '---' || 
      text.startsWith('#') || 
      text.length < 2 ||
      /^[\-_=\s]+$/.test(text) ||
      /^[0-9]+$/.test(text)) {
    return true;
  }
  
  return false;
}
