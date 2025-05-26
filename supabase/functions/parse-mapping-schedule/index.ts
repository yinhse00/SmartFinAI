
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
    console.log('Starting mapping schedule parsing...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find the mapping schedule file
    const { data: documents, error: documentsError } = await supabase
      .from('reference_documents')
      .select('*')
      .ilike('title', '%Mapping_schedule_FAQ_Guidance Materials for Listed Issuers%')
      .single()

    if (documentsError || !documents) {
      console.error('Document not found:', documentsError);
      throw new Error('Mapping schedule FAQ file not found. Please ensure the "Mapping_schedule_FAQ_Guidance Materials for Listed Issuers.xlsx" file is uploaded.')
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
    const guidance = await parseExcelMapping(arrayBuffer, documents.id)
    
    console.log(`Extracted ${guidance.length} guidance entries`);

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

    console.log(`Successfully inserted ${insertedGuidance} guidance entries`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed mapping schedule from ${documents.title}`,
        data: {
          totalFAQs: 0,
          totalGuidance: guidance.length,
          insertedFAQs: 0,
          insertedGuidance,
          sampleFAQs: [],
          sampleGuidance: guidance.slice(0, 3)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Mapping schedule parsing error:', error);
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

async function parseExcelMapping(arrayBuffer: ArrayBuffer, sourceDocumentId: string): Promise<GuidanceEntry[]> {
  console.log('Starting Excel mapping parsing...');
  
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
    
    // Parse the mapping table
    const sheetEntries = parseMappingTable(jsonData, sourceDocumentId);
    guidance.push(...sheetEntries);
    console.log(`Extracted ${sheetEntries.length} mapping entries from ${sheetName}`);
  }
  
  return guidance;
}

function parseMappingTable(data: string[][], sourceDocumentId: string): GuidanceEntry[] {
  const entries: GuidanceEntry[] = [];
  
  console.log('Parsing mapping table data...');
  
  // Look for the header row that contains our expected columns
  let headerRowIndex = -1;
  let columnMapping: { [key: string]: number } = {};
  
  // Search for header row by looking for key column names
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;
    
    // Check if this row contains header-like content
    const cellTexts = row.map(cell => String(cell || '').toLowerCase().trim());
    
    // Look for key columns
    const faqNumberIndex = cellTexts.findIndex(text => 
      text.includes('faq number') || text.includes('faq')
    );
    const topicsIndex = cellTexts.findIndex(text => 
      text.includes('topics') && !text.includes('sub')
    );
    const particularsIndex = cellTexts.findIndex(text => 
      text.includes('particulars')
    );
    
    if (faqNumberIndex >= 0 && (topicsIndex >= 0 || particularsIndex >= 0)) {
      headerRowIndex = i;
      columnMapping = {
        faqNumber: faqNumberIndex,
        topics: topicsIndex >= 0 ? topicsIndex : -1,
        particulars: particularsIndex >= 0 ? particularsIndex : -1,
        subTopics: cellTexts.findIndex(text => text.includes('sub-topics') || text.includes('subtopics')),
        mbRules: cellTexts.findIndex(text => text.includes('mb listing') || (text.includes('listing') && text.includes('rules'))),
        gemRules: cellTexts.findIndex(text => text.includes('gem listing') || text.includes('gem')),
        releaseDate: cellTexts.findIndex(text => text.includes('release date') || text.includes('date'))
      };
      
      console.log(`Found header row at index ${i} with column mapping:`, columnMapping);
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    console.warn('Could not find valid header row');
    return entries;
  }
  
  // Process data rows starting after the header
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    try {
      // Extract data using column mapping
      const faqNumber = cleanText(row[columnMapping.faqNumber]);
      const topics = columnMapping.topics >= 0 ? cleanText(row[columnMapping.topics]) : '';
      const particulars = columnMapping.particulars >= 0 ? cleanText(row[columnMapping.particulars]) : '';
      const subTopics = columnMapping.subTopics >= 0 ? cleanText(row[columnMapping.subTopics]) : '';
      const mbRules = columnMapping.mbRules >= 0 ? cleanText(row[columnMapping.mbRules]) : '';
      const gemRules = columnMapping.gemRules >= 0 ? cleanText(row[columnMapping.gemRules]) : '';
      const releaseDate = columnMapping.releaseDate >= 0 ? cleanText(row[columnMapping.releaseDate]) : '';
      
      // Skip empty or invalid rows
      if (!faqNumber || faqNumber.length < 2) continue;
      if (faqNumber.toLowerCase().includes('faq number') || faqNumber === '#') continue;
      if (faqNumber.toLowerCase().includes('withdrawn')) continue;
      
      // Build meaningful content from available data
      let content = '';
      let title = '';
      
      if (particulars && particulars.trim() !== '') {
        title = particulars;
        content += `Topic: ${particulars}\n`;
      } else if (topics && topics.trim() !== '') {
        title = topics;
        content += `Topic: ${topics}\n`;
      } else {
        title = `FAQ ${faqNumber}`;
        content += `FAQ Number: ${faqNumber}\n`;
      }
      
      if (topics && topics !== title) {
        content += `Category: ${topics}\n`;
      }
      if (subTopics) {
        content += `Sub-category: ${subTopics}\n`;
      }
      if (mbRules) {
        content += `Main Board Rules: ${mbRules}\n`;
      }
      if (gemRules) {
        content += `GEM Rules: ${gemRules}\n`;
      }
      if (releaseDate) {
        content += `First Release Date: ${releaseDate}\n`;
      }
      
      // Ensure we have meaningful content
      if (!content.trim()) {
        content = `FAQ ${faqNumber} - Please refer to the original mapping schedule for details.`;
      }
      
      // Extract applicable rules
      const applicableRules: string[] = [];
      if (mbRules) {
        applicableRules.push(...extractRuleNumbers(mbRules));
      }
      if (gemRules) {
        applicableRules.push(...extractRuleNumbers(gemRules));
      }
      
      const entry: GuidanceEntry = {
        title: title.trim(),
        content: content.trim(),
        guidance_number: faqNumber,
        source_document_id: sourceDocumentId
      };
      
      if (applicableRules.length > 0) {
        entry.applicable_rules = applicableRules;
      }
      
      if (releaseDate && isValidDate(releaseDate)) {
        entry.issue_date = parseDate(releaseDate);
      }
      
      entries.push(entry);
      
      // Log first few entries for debugging
      if (entries.length <= 5) {
        console.log(`Entry ${entries.length}:`, {
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
  
  console.log(`Successfully parsed ${entries.length} guidance entries`);
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

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  
  // Check for common date patterns
  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  // MM/DD/YY or MM/DD/YYYY
    /^\d{1,2}-\d{1,2}-\d{2,4}$/,   // MM-DD-YY or MM-DD-YYYY
    /^\d{4}-\d{1,2}-\d{1,2}$/      // YYYY-MM-DD
  ];
  
  return datePatterns.some(pattern => pattern.test(dateStr));
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Handle various date formats
    let parsedDate: Date;
    
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      const fullYear = year.length === 2 ? `20${year}` : year;
      parsedDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else if (dateStr.includes('-')) {
      parsedDate = new Date(dateStr);
    } else {
      return '';
    }
    
    return parsedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`, error);
    return '';
  }
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
