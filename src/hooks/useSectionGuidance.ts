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

function defaultFieldsForSection(sectionType: string): GuidanceField[] {
  const st = (sectionType || '').toLowerCase();
  if (st.includes('financial')) {
    return [
      { id: 'accounting_policies_summary', label: 'Summary of significant accounting policies', required: true, type: 'textarea' },
      { id: 'key_financial_metrics', label: 'Key financial metrics (revenue, gross profit, net profit)', required: true, type: 'textarea' },
      { id: 'segment_reporting_highlights', label: 'Segment reporting highlights', required: false, type: 'textarea' },
      { id: 'liquidity_and_capital_resources', label: 'Liquidity and capital resources', required: true, type: 'textarea' },
      { id: 'indebtedness', label: 'Indebtedness', required: false, type: 'textarea' },
      { id: 'dividends', label: 'Dividends', required: false, type: 'textarea' },
      { id: 'subsequent_events', label: 'Subsequent events', required: false, type: 'textarea' },
    ];
  }
  // Business
  return [
    { id: 'company_description', label: 'Company Description', required: true, type: 'textarea' },
    { id: 'principal_activities', label: 'Principal Activities', required: true, type: 'textarea' },
    { id: 'business_model', label: 'Business Model', required: true, type: 'textarea' },
    { id: 'competitive_strengths', label: 'Competitive Strengths', required: false, type: 'textarea' },
    { id: 'sales_channels', label: 'Sales channels and geographies', required: false, type: 'textarea' },
    { id: 'major_customers', label: 'Major customers', required: false, type: 'textarea' },
    { id: 'suppliers', label: 'Suppliers', required: false, type: 'textarea' },
    { id: 'seasonality', label: 'Seasonality', required: false, type: 'textarea' },
  ];
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
          .ilike('Section', sectionType)
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
    const parsed = parseRequirements(data?.contentsRequirements);
    if (parsed.length > 0) return parsed;
    return defaultFieldsForSection(sectionType);
  }, [data?.contentsRequirements, sectionType]);

  return { data, fields, loading, error };
}
