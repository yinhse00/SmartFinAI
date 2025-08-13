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
  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const fields: GuidanceField[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[-•\d\.\)\s]+/, '').trim();
    if (!cleaned) continue;
    const required = /\b(must|shall|required)\b/i.test(line);
    const id = slugify(cleaned);
    fields.push({ id, label: cleaned, required, type: cleaned.length > 60 ? 'textarea' : 'text' });
  }
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
          .select('*')
          .ilike('Section', `%${sectionType}%`)
          .limit(1)
          .maybeSingle();
        if (!active) return;
        if (error) {
          console.warn('Guidance fetch error:', error);
        }
        setData({
          guidance: data?.Guidance ?? null,
          contents: data?.contents ?? null,
          contentsRequirements: (data && (data['contents requirements'] as any)) ?? null,
          references: data?.references ?? null,
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
    if (parsedReq.length > 0) return parsedReq;
    return parseContents(data?.contents);
  }, [data?.contentsRequirements, data?.contents]);

  return { data, fields, loading, error };
}
