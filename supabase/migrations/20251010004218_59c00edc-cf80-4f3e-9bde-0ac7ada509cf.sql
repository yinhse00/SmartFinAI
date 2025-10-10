-- Phase 1: AI-Powered Document Structure Discovery
-- Create tables to store AI-discovered document structure

-- Table for AI-discovered content blocks
CREATE TABLE IF NOT EXISTS financial_content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_statement_id uuid REFERENCES financial_statements(id) ON DELETE CASCADE,
  
  -- AI-discovered metadata (no hardcoded types)
  block_type text NOT NULL,
  semantic_classification jsonb DEFAULT '[]'::jsonb,
  
  -- Dynamic content (structure learned by AI)
  content jsonb NOT NULL,
  
  -- AI-generated scores
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  relevance_score numeric CHECK (relevance_score >= 0 AND relevance_score <= 1),
  
  -- Location tracking (dynamic)
  section_path text[] DEFAULT '{}',
  page_numbers integer[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now()
);

-- Table for AI-discovered cross-references
CREATE TABLE IF NOT EXISTS financial_cross_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_block_id uuid REFERENCES financial_content_blocks(id) ON DELETE CASCADE,
  target_block_id uuid REFERENCES financial_content_blocks(id) ON DELETE CASCADE,
  
  -- AI-determined relationship (not hardcoded types)
  relationship_type text NOT NULL,
  relationship_metadata jsonb DEFAULT '{}'::jsonb,
  
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_blocks_statement ON financial_content_blocks(financial_statement_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_relevance ON financial_content_blocks(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_cross_refs_source ON financial_cross_references(source_block_id);
CREATE INDEX IF NOT EXISTS idx_cross_refs_target ON financial_cross_references(target_block_id);

-- Enable RLS
ALTER TABLE financial_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_cross_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_content_blocks
CREATE POLICY "Users can view content blocks of their projects"
  ON financial_content_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM financial_statements fs
      JOIN ipo_prospectus_projects p ON p.id = fs.project_id
      WHERE fs.id = financial_content_blocks.financial_statement_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content blocks for their projects"
  ON financial_content_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM financial_statements fs
      JOIN ipo_prospectus_projects p ON p.id = fs.project_id
      WHERE fs.id = financial_content_blocks.financial_statement_id
        AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for financial_cross_references
CREATE POLICY "Users can view cross-references of their projects"
  ON financial_cross_references
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM financial_content_blocks fcb
      JOIN financial_statements fs ON fs.id = fcb.financial_statement_id
      JOIN ipo_prospectus_projects p ON p.id = fs.project_id
      WHERE fcb.id = financial_cross_references.source_block_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cross-references for their projects"
  ON financial_cross_references
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM financial_content_blocks fcb
      JOIN financial_statements fs ON fs.id = fcb.financial_statement_id
      JOIN ipo_prospectus_projects p ON p.id = fs.project_id
      WHERE fcb.id = financial_cross_references.source_block_id
        AND p.user_id = auth.uid()
    )
  );