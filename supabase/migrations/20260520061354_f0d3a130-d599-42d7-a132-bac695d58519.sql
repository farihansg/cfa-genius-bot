CREATE TABLE public.pitch_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deck_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'upload',
  source_url TEXT,
  overall_score INTEGER,
  scores JSONB,
  strengths JSONB,
  weaknesses JSONB,
  improvements JSONB,
  summary TEXT,
  vc_verdict TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own analyses" ON public.pitch_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own analyses" ON public.pitch_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own analyses" ON public.pitch_analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_pitch_analyses_user ON public.pitch_analyses(user_id, created_at DESC);