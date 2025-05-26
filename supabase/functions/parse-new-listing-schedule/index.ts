
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GuidanceEntry {
  title: string;
  content: string;
  guidance_number?: string;
  applicable_rules?: string[];
  source_document_id: string;
  issue_date?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting new listing applicants mapping schedule parsing...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find the new listing applicants mapping schedule file
    const { data: documents, error: documentsError } = await supabase
      .from('reference_documents')
      .select('*')
      .ilike('title', '%Guide for New Listing Applicants%')
      .single()

    if (documentsError || !documents) {
      console.error('Document not found:', documentsError);
      throw new Error('New listing applicants mapping schedule file not found. Please ensure the "Mapping_Schedule_(EN)_(2024)_Guide for New Listing Applicants" file is uploaded.')
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
    
    // Parse Excel content
    const guidance = await parseNewListingExcel(arrayBuffer, documents.id)
    
    console.log(`Extracted ${guidance.length} new listing guidance entries`);

    if (guidance.length === 0) {
      throw new Error('No data extracted from the Excel file. Please check the file format and content.')
    }

    // Clear existing data from this source
    await clearExistingData(supabase, documents.id);

    // Insert new data
    let insertedGuidance = 0;

    if (guidance.length > 0) {
      insertedGuidance = await insertGuidance(supabase, guidance);
    }

    console.log(`Successfully inserted ${insertedGuidance} new listing guidance entries`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed new listing applicants mapping schedule from ${documents.title}`,
        data: {
          totalFAQs: 0,
          totalGuidance: guidance.length,
          insertedFAQs: 0,
          insertedGuidance,
          sampleFAQs: [],
          sampleGuidance: guidance.slice(0, 3),
          fileType: 'new-listing-applicants'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('New listing mapping schedule parsing error:', error);
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

async function parseNewListingExcel(arrayBuffer: ArrayBuffer, sourceDocumentId: string): Promise<GuidanceEntry[]> {
  console.log('Starting Excel new listing mapping parsing...');
  
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
    raw: false
  });
  
  console.log('Workbook parsed. Sheet names:', workbook.SheetNames);
  
  const guidance: GuidanceEntry[] = [];
  
  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    console.log(`Processing sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false,
      blankrows: false
    }) as string[][];
    
    if (jsonData.length === 0) continue;
    
    console.log(`Sheet "${sheetName}" contains ${jsonData.length} rows`);
    
    // Parse the new listing mapping table
    const sheetEntries = parseNewListingMappingTable(jsonData, sourceDocumentId);
    guidance.push(...sheetEntries);
    console.log(`Extracted ${sheetEntries.length} new listing mapping entries from ${sheetName}`);
  }
  
  return guidance;
}

function parseNewListingMappingTable(data: string[][], sourceDocumentId: string): GuidanceEntry[] {
  const entries: GuidanceEntry[] = [];
  
  console.log('Parsing new listing mapping table data...');
  
  // Look for the header row that contains our expected columns
  let headerRowIndex = -1;
  let columnMapping: { [key: string]: number } = {};
  
  // Search for header row by looking for key column names specific to new listing guide
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    // Check if this row contains header-like content
    const cellTexts = row.map(cell => String(cell || '').toLowerCase().trim());
    
    // Look for key columns in new listing guide
    const requirementIndex = cellTexts.findIndex(text => 
      text.includes('requirement') || text.includes('criteria') || text.includes('listing requirement')
    );
    const descriptionIndex = cellTexts.findIndex(text => 
      text.includes('description') || text.includes('details') || text.includes('particular')
    );
    const ruleIndex = cellTexts.findIndex(text => 
      text.includes('rule') || text.includes('chapter') || text.includes('listing rules')
    );
    
    if (requirementIndex >= 0 && (descriptionIndex >= 0 || ruleIndex >= 0)) {
      headerRowIndex = i;
      columnMapping = {
        requirement: requirementIndex,
        description: descriptionIndex >= 0 ? descriptionIndex : -1,
        rule: ruleIndex >= 0 ? ruleIndex : -1,
        category: cellTexts.findIndex(text => text.includes('category') || text.includes('type')),
        applicability: cellTexts.findIndex(text => text.includes('applicab') || text.includes('applies')),
        reference: cellTexts.findIndex(text => text.includes('reference') || text.includes('ref')),
        notes: cellTexts.findIndex(text => text.includes('note') || text.includes('remark'))
      };
      
      console.log(`Found header row at index ${i} with column mapping:`, columnMapping);
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    console.warn('Could not find valid header row, using fallback parsing');
    // Fallback: assume first few columns contain relevant data
    columnMapping = {
      requirement: 0,
      description: 1,
      rule: 2,
      category: 3,
      applicability: 4,
      reference: 5,
      notes: 6
    };
    headerRowIndex = 0;
  }
  
  // Process data rows starting after the header
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    try {
      // Extract data using column mapping
      const requirement = cleanText(row[columnMapping.requirement]);
      const description = columnMapping.description >= 0 ? cleanText(row[columnMapping.description]) : '';
      const rule = columnMapping.rule >= 0 ? cleanText(row[columnMapping.rule]) : '';
      const category = columnMapping.category >= 0 ? cleanText(row[columnMapping.category]) : '';
      const applicability = columnMapping.applicability >= 0 ? cleanText(row[columnMapping.applicability]) : '';
      const reference = columnMapping.reference >= 0 ? cleanText(row[columnMapping.reference]) : '';
      const notes = columnMapping.notes >= 0 ? cleanText(row[columnMapping.notes]) : '';
      
      // Skip empty or invalid rows
      if (!requirement || requirement.length < 3) continue;
      if (requirement.toLowerCase().includes('requirement') && requirement.length < 15) continue;
      
      // Build meaningful content from available data
      let content = '';
      let title = requirement;
      
      content += `New Listing Requirement: ${requirement}\n`;
      
      if (description && description.trim() !== '') {
        content += `Description: ${description}\n`;
      }
      if (category && category.trim() !== '') {
        content += `Category: ${category}\n`;
      }
      if (rule && rule.trim() !== '') {
        content += `Applicable Rules: ${rule}\n`;
      }
      if (applicability && applicability.trim() !== '') {
        content += `Applicability: ${applicability}\n`;
      }
      if (reference && reference.trim() !== '') {
        content += `Reference: ${reference}\n`;
      }
      if (notes && notes.trim() !== '') {
        content += `Notes: ${notes}\n`;
      }
      
      // Extract applicable rules
      const applicableRules: string[] = [];
      if (rule) {
        applicableRules.push(...extractRuleNumbers(rule));
      }
      if (reference) {
        applicableRules.push(...extractRuleNumbers(reference));
      }
      
      const entry: GuidanceEntry = {
        title: title.trim(),
        content: content.trim(),
        guidance_number: `NL-${i - headerRowIndex}`, // New Listing prefix
        source_document_id: sourceDocumentId
      };
      
      if (applicableRules.length > 0) {
        entry.applicable_rules = [...new Set(applicableRules)]; // Remove duplicates
      }
      
      entries.push(entry);
      
      // Log first few entries for debugging
      if (entries.length <= 5) {
        console.log(`New Listing Entry ${entries.length}:`, {
          title: entry.title,
          guidance_number: entry.guidance_number,
          content_preview: entry.content.substring(0, 100) + '...'
        });
      }
      
    } catch (error) {
      console.error(`Error processing row ${i}:`, error);
      continue;
    }
  }
  
  console.log(`Successfully parsed ${entries.length} new listing guidance entries`);
  return entries;
}

function extractRuleNumbers(text: string): string[] {
  if (!text) return [];
  
  // Extract rule numbers like "1.01", "14A.12(1)(b)", etc.
  const rulePattern = /\d+[A-Za-z]*\.\d+(\([^)]+\))*(\([^)]+\))*/g;
  const matches = text.match(rulePattern) || [];
  
  return matches
    .map(match => match.trim())
    .filter(match => match.length > 0)
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
}

function cleanText(cell: any): string {
  if (cell === null || cell === undefined) return '';
  
  return String(cell)
    .trim()
    .replace(/^\"|\"$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

async function clearExistingData(supabase: any, sourceDocumentId: string) {
  console.log('Clearing existing data for source document:', sourceDocumentId);
  
  const { error: guidanceError } = await supabase
    .from('interpretation_guidance')
    .delete()
    .eq('source_document_id', sourceDocumentId);
  
  if (guidanceError) {
    console.error('Error clearing existing guidance:', guidanceError);
  }
}

async function insertGuidance(supabase: any, guidance: GuidanceEntry[]): Promise<number> {
  console.log(`Inserting ${guidance.length} guidance entries...`);
  
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < guidance.length; i += batchSize) {
    const batch = guidance.slice(i, i + batchSize);
    
    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}: entries ${i + 1} to ${Math.min(i + batchSize, guidance.length)}`);
    
    const { error } = await supabase
      .from('interpretation_guidance')
      .insert(batch);
    
    if (error) {
      console.error('Error inserting guidance batch:', error);
      console.error('Failed batch data:', batch);
      throw new Error(`Failed to insert guidance batch: ${error.message}`);
    }
    
    inserted += batch.length;
    console.log(`Successfully inserted batch, total inserted: ${inserted}`);
  }
  
  return inserted;
}
