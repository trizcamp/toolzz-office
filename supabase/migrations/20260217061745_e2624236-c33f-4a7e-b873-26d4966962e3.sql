
-- Automations table
CREATE TABLE public.automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Nova Automação',
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation steps (sequential actions)
CREATE TABLE public.automation_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for automations
CREATE POLICY "Users can read own automations" ON public.automations FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert own automations" ON public.automations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own automations" ON public.automations FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own automations" ON public.automations FOR DELETE USING (auth.uid() = created_by);

-- RLS policies for automation_steps (based on parent automation ownership)
CREATE POLICY "Users can manage own automation_steps" ON public.automation_steps FOR ALL 
USING (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_steps.automation_id AND created_by = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_automations_updated_at
BEFORE UPDATE ON public.automations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_automation_steps_automation_id ON public.automation_steps(automation_id);
