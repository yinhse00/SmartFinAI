-- Add missing columns to materiality_analysis table
ALTER TABLE materiality_analysis 
ADD COLUMN IF NOT EXISTS yoy_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS yoy_threshold numeric DEFAULT 20.0,
ADD COLUMN IF NOT EXISTS extracted_periods jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS audit_status text DEFAULT 'Unknown';

-- Add metadata column to ipo_prospectus_sections for MD&A tracking
ALTER TABLE ipo_prospectus_sections 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;