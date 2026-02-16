
-- Table to store GitHub personal access tokens per user
CREATE TABLE public.github_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  github_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.github_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own github integration"
  ON public.github_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own github integration"
  ON public.github_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own github integration"
  ON public.github_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own github integration"
  ON public.github_integrations FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_github_integrations_updated_at
  BEFORE UPDATE ON public.github_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add github fields to tasks
ALTER TABLE public.tasks ADD COLUMN github_repo TEXT;
ALTER TABLE public.tasks ADD COLUMN github_issue_url TEXT;
ALTER TABLE public.tasks ADD COLUMN github_issue_number INTEGER;
