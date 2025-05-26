
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
    
    // Determine sheet type and parse accordingly
    const sheetType = determineSheetType(jsonData, sheetName);
    console.log(`Sheet type determined: ${sheetType}`);
    
    if (sheetType === 'faq') {
      const sheetFAQs = parseFAQSheet(jsonData, sourceDocumentId);
      faqs.push(...sheetFAQs);
      console.log(`Extracted ${sheetFAQs.length} FAQs from ${sheetName}`);
    } else if (sheetType === 'guidance') {
      const sheetGuidance = parseGuidanceSheet(jsonData, sourceDocumentId);
      guidance.push(...sheetGuidance);
      console.log(`Extracted ${sheetGuidance.length} guidance entries from ${sheetName}`);
    } else {
      console.log(`Skipping sheet ${sheetName} - unrecognized format`);
    }
  }
  
  return { faqs, guidance };
}

function determineSheetType(data: string[][], sheetName: string): 'faq' | 'guidance' | 'unknown' {
  const sheetNameLower = sheetName.toLowerCase();
  
  // Check sheet name first
  if (sheetNameLower.includes('faq') || sheetNameLower.includes('q&a') || sheetNameLower.includes('question')) {
    return 'faq';
  }
  
  if (sheetNameLower.includes('guidance') || sheetNameLower.includes('interpretation')) {
    return 'guidance';
  }
  
  // Check headers for FAQ patterns
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const rowText = row.join(' ').toLowerCase();
    
    if ((rowText.includes('question') && rowText.includes('answer')) ||
        (rowText.includes('q') && rowText.includes('a')) ||
        rowText.includes('faq')) {
      return 'faq';
    }
    
    if (rowText.includes('guidance') || 
        rowText.includes('interpretation') ||
        (rowText.includes('title') && rowText.includes('content'))) {
      return 'guidance';
    }
  }
  
  return 'unknown';
}

function parseFAQSheet(data: string[][], sourceDocumentId: string): FAQEntry[] {
  const faqs: FAQEntry[] = [];
  
  // Find header row and column positions
  const columnMapping = findFAQColumns(data);
  
  if (columnMapping.questionCol === -1 || columnMapping.answerCol === -1) {
    console.warn('Could not identify FAQ columns');
    return faqs;
  }
  
  console.log('FAQ column mapping:', columnMapping);
  
  // Process data rows
  for (let i = columnMapping.headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const question = cleanText(row[columnMapping.questionCol]);
    const answer = cleanText(row[columnMapping.answerCol]);
    
    if (!question || !answer || question.length < 5 || answer.length < 5) continue;
    
    // Extract related provisions if available
    const relatedProvisions = columnMapping.provisionsCol >= 0 ? 
      extractProvisions(row[columnMapping.provisionsCol]) : undefined;
    
    faqs.push({
      question,
      answer,
      related_provisions: relatedProvisions,
      source_document_id: sourceDocumentId
    });
  }
  
  return faqs;
}

function parseGuidanceSheet(data: string[][], sourceDocumentId: string): GuidanceEntry[] {
  const guidance: GuidanceEntry[] = [];
  
  // Find header row and column positions
  const columnMapping = findGuidanceColumns(data);
  
  if (columnMapping.titleCol === -1 || columnMapping.contentCol === -1) {
    console.warn('Could not identify guidance columns');
    return guidance;
  }
  
  console.log('Guidance column mapping:', columnMapping);
  
  // Process data rows
  for (let i = columnMapping.headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const title = cleanText(row[columnMapping.titleCol]);
    const content = cleanText(row[columnMapping.contentCol]);
    
    if (!title || !content || title.length < 3 || content.length < 10) continue;
    
    const guidanceNumber = columnMapping.numberCol >= 0 ? 
      cleanText(row[columnMapping.numberCol]) : undefined;
    
    const applicableRules = columnMapping.rulesCol >= 0 ? 
      extractProvisions(row[columnMapping.rulesCol]) : undefined;
    
    guidance.push({
      title,
      content,
      guidance_number: guidanceNumber,
      applicable_rules: applicableRules,
      source_document_id: sourceDocumentId
    });
  }
  
  return guidance;
}

function findFAQColumns(data: string[][]): {
  headerRow: number;
  questionCol: number;
  answerCol: number;
  provisionsCol: number;
} {
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    let questionCol = -1;
    let answerCol = -1;
    let provisionsCol = -1;
    
    for (let j = 0; j < row.length; j++) {
      const cellText = String(row[j] || '').toLowerCase().trim();
      
      if (questionCol === -1 && (
        cellText.includes('question') || 
        cellText === 'q' || 
        cellText.includes('query')
      )) {
        questionCol = j;
      }
      
      if (answerCol === -1 && (
        cellText.includes('answer') || 
        cellText === 'a' || 
        cellText.includes('response')
      )) {
        answerCol = j;
      }
      
      if (provisionsCol === -1 && (
        cellText.includes('provision') || 
        cellText.includes('rule') || 
        cellText.includes('reference')
      )) {
        provisionsCol = j;
      }
    }
    
    if (questionCol >= 0 && answerCol >= 0) {
      return {
        headerRow: i,
        questionCol,
        answerCol,
        provisionsCol
      };
    }
  }
  
  return {
    headerRow: -1,
    questionCol: -1,
    answerCol: -1,
    provisionsCol: -1
  };
}

function findGuidanceColumns(data: string[][]): {
  headerRow: number;
  titleCol: number;
  contentCol: number;
  numberCol: number;
  rulesCol: number;
} {
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    let titleCol = -1;
    let contentCol = -1;
    let numberCol = -1;
    let rulesCol = -1;
    
    for (let j = 0; j < row.length; j++) {
      const cellText = String(row[j] || '').toLowerCase().trim();
      
      if (titleCol === -1 && (
        cellText.includes('title') || 
        cellText.includes('subject') || 
        cellText.includes('topic')
      )) {
        titleCol = j;
      }
      
      if (contentCol === -1 && (
        cellText.includes('content') || 
        cellText.includes('description') || 
        cellText.includes('guidance') ||
        cellText.includes('interpretation')
      )) {
        contentCol = j;
      }
      
      if (numberCol === -1 && (
        cellText.includes('number') || 
        cellText.includes('id') || 
        cellText.includes('ref')
      )) {
        numberCol = j;
      }
      
      if (rulesCol === -1 && (
        cellText.includes('rule') || 
        cellText.includes('provision') || 
        cellText.includes('applicable')
      )) {
        rulesCol = j;
      }
    }
    
    if (titleCol >= 0 && contentCol >= 0) {
      return {
        headerRow: i,
        titleCol,
        contentCol,
        numberCol,
        rulesCol
      };
    }
  }
  
  return {
    headerRow: -1,
    titleCol: -1,
    contentCol: -1,
    numberCol: -1,
    rulesCol: -1
  };
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

function extractProvisions(text: string): string[] | undefined {
  if (!text) return undefined;
  
  const cleaned = cleanText(text);
  if (!cleaned) return undefined;
  
  // Split by common separators and clean
  const provisions = cleaned
    .split(/[,;|]/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .filter(p => p.length < 100); // Reasonable length filter
  
  return provisions.length > 0 ? provisions : undefined;
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
