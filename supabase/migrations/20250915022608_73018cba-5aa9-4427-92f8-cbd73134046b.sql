-- Create financial statements table
CREATE TABLE public.financial_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ipo_prospectus_projects(id) ON DELETE CASCADE,
  statement_type TEXT NOT NULL CHECK (statement_type IN ('profit_loss', 'balance_sheet', 'cash_flow')),
  file_name TEXT NOT NULL,
  extracted_data JSONB,
  total_revenue NUMERIC,
  total_assets NUMERIC,
  total_liabilities NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materiality analysis table
CREATE TABLE public.materiality_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ipo_prospectus_projects(id) ON DELETE CASCADE,
  financial_statement_id UUID REFERENCES public.financial_statements(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('revenue_item', 'asset_item', 'liability_item')),
  amount NUMERIC NOT NULL,
  base_amount NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  materiality_threshold NUMERIC DEFAULT 5.0,
  is_material BOOLEAN DEFAULT false,
  ai_suggested BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  business_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiality_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_statements
CREATE POLICY "Users can view their own financial statements"
ON public.financial_statements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects 
    WHERE id = financial_statements.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own financial statements"
ON public.financial_statements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects 
    WHERE id = financial_statements.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own financial statements"
ON public.financial_statements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects 
    WHERE id = financial_statements.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own financial statements"
ON public.financial_statements
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects 
    WHERE id = financial_statements.project_id 
    AND user_id = auth.uid()
  )
);

-- Create policies for materiality_analysis
CREATE POLICY "Users can view their own materiality analysis"
ON public.materiality_analysis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects 
    WHERE id = materiality_analysis.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own materiality analysis"
ON public.materiality_analysis
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects 
    WHERE id = materiality_analysis.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own materiality analysis"
ON public.materiality_analysis
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects 
    WHERE id = materiality_analysis.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own materiality analysis"
ON public.materiality_analysis
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects 
    WHERE id = materiality_analysis.project_id 
    AND user_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_financial_statements_updated_at
  BEFORE UPDATE ON public.financial_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

CREATE TRIGGER update_materiality_analysis_updated_at
  BEFORE UPDATE ON public.materiality_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

-- Create indexes for better performance
CREATE INDEX idx_financial_statements_project_id ON public.financial_statements(project_id);
CREATE INDEX idx_financial_statements_statement_type ON public.financial_statements(statement_type);
CREATE INDEX idx_materiality_analysis_project_id ON public.materiality_analysis(project_id);
CREATE INDEX idx_materiality_analysis_financial_statement_id ON public.materiality_analysis(financial_statement_id);
CREATE INDEX idx_materiality_analysis_item_type ON public.materiality_analysis(item_type);
CREATE INDEX idx_materiality_analysis_is_material ON public.materiality_analysis(is_material);