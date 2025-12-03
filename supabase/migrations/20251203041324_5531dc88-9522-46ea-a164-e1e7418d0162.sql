-- Word Add-in Sessions table
CREATE TABLE public.word_addon_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.ipo_prospectus_projects(id) ON DELETE SET NULL,
  document_hash TEXT,
  last_analysis JSONB,
  language TEXT DEFAULT 'en',
  section_type TEXT,
  amendments_applied INTEGER DEFAULT 0,
  amendments_rejected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Word Add-in Amendments tracking table
CREATE TABLE public.word_addon_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.word_addon_sessions(id) ON DELETE CASCADE,
  amendment_type TEXT NOT NULL,
  search_text TEXT NOT NULL,
  replacement_text TEXT,
  comment_text TEXT,
  regulatory_citation TEXT,
  severity TEXT DEFAULT 'medium',
  user_action TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.word_addon_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_addon_amendments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for word_addon_sessions
CREATE POLICY "Users can view own sessions"
  ON public.word_addon_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.word_addon_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.word_addon_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.word_addon_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for word_addon_amendments
CREATE POLICY "Users can view own amendments"
  ON public.word_addon_amendments FOR SELECT
  USING (session_id IN (SELECT id FROM public.word_addon_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own amendments"
  ON public.word_addon_amendments FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM public.word_addon_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own amendments"
  ON public.word_addon_amendments FOR UPDATE
  USING (session_id IN (SELECT id FROM public.word_addon_sessions WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_word_addon_sessions_user ON public.word_addon_sessions(user_id);
CREATE INDEX idx_word_addon_sessions_project ON public.word_addon_sessions(project_id);
CREATE INDEX idx_word_addon_sessions_hash ON public.word_addon_sessions(document_hash);
CREATE INDEX idx_word_addon_amendments_session ON public.word_addon_amendments(session_id);

-- Updated at trigger
CREATE TRIGGER update_word_addon_sessions_updated_at
  BEFORE UPDATE ON public.word_addon_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();