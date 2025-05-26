
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FAQEntry {
  question: string;
  answer: string;
  related_provisions?: string[];
  source_document_id: string;
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
    const { faqs, guidance } = await parseExcelMapping(arrayBuffer, documents.id)
    
    console.log(`Extracted ${faqs.length} FAQs and ${guidance.length} guidance entries`);

    if (faqs.length === 0 && guidance.length === 0) {
      throw new Error('No data extracted from the Excel file. Please check the file format and content.')
    }

    // Clear existing data from this source
    await clearExistingData(supabase, documents.id);

    // Insert new data
    let insertedFAQs = 0;
    let insertedGuidance = 0;

    if (faqs.length > 0) {
      insertedFAQs = await insertFAQs(supabase, faqs);
    }

    if (guidance.length > 0) {
      insertedGuidance = await insertGuidance(supabase, guidance);
    }

    console.log(`Successfully inserted ${insertedFAQs} FAQs and ${insertedGuidance} guidance entries`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed mapping schedule from ${documents.title}`,
        data: {
          totalFAQs: faqs.length,
          totalGuidance: guidance.length,
          insertedFAQs,
          insertedGuidance,
          sampleFAQs: faqs.slice(0, 3),
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

async function parseExcelMapping(arrayBuffer: ArrayBuffer, sourceDocumentId: string): Promise<{
  faqs: FAQEntry[];
  guidance: GuidanceEntry[];
}> {
  console.log('Starting Excel mapping parsing...');
  
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
    raw: false
  });
  
  console.log('Workbook parsed. Sheet names:', workbook.SheetNames);
  
  const faqs: FAQEntry[] = [];
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
    
    // Based on the logs, this is a mapping table with FAQ references, not actual FAQs
    // Let's parse it as guidance entries instead
    const sheetEntries = parseMappingTable(jsonData, sourceDocumentId);
    guidance.push(...sheetEntries);
    console.log(`Extracted ${sheetEntries.length} mapping entries from ${sheetName}`);
  }
  
  return { faqs, guidance };
}

function parseMappingTable(data: string[][], sourceDocumentId: string): GuidanceEntry[] {
  const entries: GuidanceEntry[] = [];
  
  console.log('Parsing mapping table data...');
  
  // Look for the header row - should contain columns like FAQ Number, Topics, etc.
  let headerRow = -1;
  let faqNumberCol = -1;
  let topicsCol = -1;
  let subTopicsCol = -1;
  let particularsCol = -1;
  let mbRulesCol = -1;
  let gemRulesCol = -1;
  
  // Find header row
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;
    
    console.log(`Checking row ${i} for headers:`, row);
    
    for (let j = 0; j < row.length; j++) {
      const cellText = String(row[j] || '').toLowerCase().trim();
      
      if (cellText.includes('faq number') || cellText.includes('faq')) {
        faqNumberCol = j;
      }
      if (cellText.includes('topics') && !cellText.includes('sub')) {
        topicsCol = j;
      }
      if (cellText.includes('sub-topics') || cellText.includes('subtopics')) {
        subTopicsCol = j;
      }
      if (cellText.includes('particulars')) {
        particularsCol = j;
      }
      if (cellText.includes('mb listing') || (cellText.includes('listing') && cellText.includes('rules'))) {
        mbRulesCol = j;
      }
      if (cellText.includes('gem listing') || cellText.includes('gem')) {
        gemRulesCol = j;
      }
    }
    
    // If we found key columns, this is likely the header row
    if (faqNumberCol >= 0 && topicsCol >= 0) {
      headerRow = i;
      console.log(`Found header row at ${i}: FAQ=${faqNumberCol}, Topics=${topicsCol}, SubTopics=${subTopicsCol}, Particulars=${particularsCol}`);
      break;
    }
  }
  
  if (headerRow === -1) {
    console.warn('Could not find header row, trying alternative parsing...');
    return [];
  }
  
  // Process data rows
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    try {
      const faqNumber = cleanText(row[faqNumberCol]);
      const topics = cleanText(row[topicsCol]);
      const subTopics = subTopicsCol >= 0 ? cleanText(row[subTopicsCol]) : '';
      const particulars = particularsCol >= 0 ? cleanText(row[particularsCol]) : '';
      const mbRules = mbRulesCol >= 0 ? cleanText(row[mbRulesCol]) : '';
      const gemRules = gemRulesCol >= 0 ? cleanText(row[gemRulesCol]) : '';
      
      // Skip rows without meaningful content
      if (!faqNumber || (!topics && !particulars)) continue;
      
      // Skip header-like rows
      if (faqNumber.toLowerCase().includes('faq number') || 
          faqNumber === '#' || 
          faqNumber.length < 2) continue;
      
      // Build content from available fields
      let content = '';
      if (particulars) content += `Particulars: ${particulars}\n`;
      if (topics) content += `Topic: ${topics}\n`;
      if (subTopics) content += `Sub-topic: ${subTopics}\n`;
      if (mbRules) content += `Main Board Rules: ${mbRules}\n`;
      if (gemRules) content += `GEM Rules: ${gemRules}\n`;
      
      if (!content.trim()) continue;
      
      // Extract applicable rules
      const applicableRules: string[] = [];
      if (mbRules) {
        applicableRules.push(...extractRuleNumbers(mbRules));
      }
      if (gemRules) {
        applicableRules.push(...extractRuleNumbers(gemRules));
      }
      
      const title = topics || `FAQ ${faqNumber}`;
      
      entries.push({
        title: title,
        content: content.trim(),
        guidance_number: faqNumber,
        applicable_rules: applicableRules.length > 0 ? applicableRules : undefined,
        source_document_id: sourceDocumentId
      });
      
      // Log first few entries for debugging
      if (entries.length <= 3) {
        console.log(`Entry ${entries.length}: ${title} - ${content.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.error(`Error processing row ${i}:`, error);
      continue;
    }
  }
  
  console.log(`Parsed ${entries.length} mapping entries`);
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
  
  const { error: faqError } = await supabase
    .from('regulatory_faqs')
    .delete()
    .eq('source_document_id', sourceDocumentId);
  
  if (faqError) {
    console.error('Error clearing existing FAQs:', faqError);
  }
  
  const { error: guidanceError } = await supabase
    .from('interpretation_guidance')
    .delete()
    .eq('source_document_id', sourceDocumentId);
  
  if (guidanceError) {
    console.error('Error clearing existing guidance:', guidanceError);
  }
}

async function insertFAQs(supabase: any, faqs: FAQEntry[]): Promise<number> {
  console.log(`Inserting ${faqs.length} FAQs...`);
  
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < faqs.length; i += batchSize) {
    const batch = faqs.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('regulatory_faqs')
      .insert(batch);
    
    if (error) {
      console.error('Error inserting FAQ batch:', error);
      throw new Error(`Failed to insert FAQ batch: ${error.message}`);
    }
    
    inserted += batch.length;
    console.log(`Inserted FAQ batch ${Math.floor(i / batchSize) + 1}, total: ${inserted}`);
  }
  
  return inserted;
}

async function insertGuidance(supabase: any, guidance: GuidanceEntry[]): Promise<number> {
  console.log(`Inserting ${guidance.length} guidance entries...`);
  
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < guidance.length; i += batchSize) {
    const batch = guidance.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('interpretation_guidance')
      .insert(batch);
    
    if (error) {
      console.error('Error inserting guidance batch:', error);
      throw new Error(`Failed to insert guidance batch: ${error.message}`);
    }
    
    inserted += batch.length;
    console.log(`Inserted guidance batch ${Math.floor(i / batchSize) + 1}, total: ${inserted}`);
  }
  
  return inserted;
}
