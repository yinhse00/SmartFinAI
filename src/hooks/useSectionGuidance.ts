import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SectionGuidanceData {
  guidance?: string | null;
  contents?: string | null;
  contentsRequirements?: string | null;
  references?: string | null;
}

export interface GuidanceField {
  id: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'textarea';
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

function parseRequirements(raw?: string | null): GuidanceField[] {
  if (!raw) return [];
  
  console.log('Parsing requirements raw data:', raw);
  
  // Split by different patterns - handle numbered/lettered lists better
  const segments = raw.split(/(?=\([ivxlcdm]+\)|(?:\d+\.|\([a-z]\)|\([A-Z]\)))/i);
  
  const fields: GuidanceField[] = [];
  
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    
    // Extract meaningful content after list markers
    let cleaned = trimmed
      .replace(/^\([ivxlcdm]+\)\s*/i, '') // Remove roman numerals (i), (ii), etc.
      .replace(/^\([a-zA-Z]\)\s*/, '') // Remove letter markers (a), (b), etc.
      .replace(/^\d+\.\s*/, '') // Remove number markers 1., 2., etc.
      .replace(/^[-•]\s*/, '') // Remove bullet points
      .trim();
    
    if (!cleaned || cleaned.length < 3) continue;
    
    // Extract the main topic/subject from the first sentence or clause
    const firstSentence = cleaned.split(/[.;:]|(?=\s(?:including|such as|for example))/i)[0].trim();
    let label = firstSentence;
    
    // Clean up common prefixes and make more user-friendly
    label = label
      .replace(/^(details?|information|description|outline)\s+(of|on|about)\s+/i, '')
      .replace(/^(the\s+)?company'?s?\s+/i, '')
      .replace(/^(provide|include|describe|explain|state|list)\s+/i, '')
      .trim();
    
    // Capitalize first letter
    if (label) {
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }
    
    if (!label || label.length < 3) continue;
    
    const required = /\b(must|shall|required|mandatory)\b/i.test(trimmed);
    const id = slugify(label);
    
    // Determine field type based on content complexity
    const isComplex = cleaned.length > 100 || 
                     /\b(details?|description|explanation|analysis|discussion)\b/i.test(cleaned) ||
                     cleaned.includes('\n');
    
    fields.push({ 
      id, 
      label, 
      required, 
      type: isComplex ? 'textarea' : 'text' 
    });
    
    console.log('Extracted field:', { id, label, required, type: isComplex ? 'textarea' : 'text' });
  }
  
  console.log('Final parsed fields:', fields);
  return fields;
}

function parseContents(raw?: string | null): GuidanceField[] {
  if (!raw) return [];
  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const fields: GuidanceField[] = [];
  for (const line of lines) {
    // Remove common list prefixes and labels like "1)", "-", "•", "Item:"
    const cleaned = line
      .replace(/^[^\-•\d\.\)\s]+\s*[:\-]\s*/, '')
      .replace(/^[\-•\d\.\)\s]+/, '')
      .trim();
    if (!cleaned) continue;
    const id = slugify(cleaned);
    fields.push({ id, label: cleaned, required: false, type: cleaned.length > 60 ? 'textarea' : 'text' });
  }
  return fields;
}

export function useSectionGuidance(sectionType: string) {
  const [data, setData] = useState<SectionGuidanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchGuidance() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await (supabase as any)
          .from('ipo_prospectus_section_guidance')
          .select('Guidance, Section, contents, "contents requirements", references')
          .ilike('Section', `%${sectionType}%`);
        if (!active) return;
        if (error) {
          console.warn('Guidance fetch error:', error);
        }
        const rows = Array.isArray(data) ? data : (data ? [data] : []);
        const guidanceText = rows.map((r: any) => r?.Guidance).filter(Boolean).join('\n\n') || null;
        const contentsReqText = rows.map((r: any) => r?.["contents requirements"]).filter(Boolean).join('\n') || null;
        const contentsText = rows.map((r: any) => r?.contents).filter(Boolean).join('\n') || null;
        const referencesText = rows.map((r: any) => r?.references).filter(Boolean).join('\n') || null;
        setData({
          guidance: guidanceText,
          contents: contentsText,
          contentsRequirements: contentsReqText,
          references: referencesText,
        });
      } catch (e: any) {
        if (!active) return;
        setError(e.message || 'Failed to load guidance');
      } finally {
        if (active) setLoading(false);
      }
    }
    if (sectionType) fetchGuidance();
    return () => { active = false; };
  }, [sectionType]);

  const fields = useMemo(() => {
    const parsedReq = parseRequirements(data?.contentsRequirements);
    const base = parsedReq.length > 0 ? parsedReq : parseContents(data?.contents);
    const map = new Map<string, GuidanceField>();
    for (const f of base) {
      const existing = map.get(f.id);
      if (existing) {
        map.set(f.id, {
          ...existing,
          required: existing.required || f.required,
          type: existing.type === 'textarea' || f.type === 'textarea' ? 'textarea' : 'text',
        });
      } else {
        map.set(f.id, f);
      }
    }
    return Array.from(map.values());
  }, [data?.contentsRequirements, data?.contents]);

  return { data, fields, loading, error };
}
