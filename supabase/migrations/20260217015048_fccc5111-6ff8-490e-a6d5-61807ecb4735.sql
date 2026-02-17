
-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'task',
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all logs (team visibility)
CREATE POLICY "Authenticated can read activity_logs"
  ON public.activity_logs FOR SELECT
  USING (true);

-- System/triggers can insert (via security definer functions)
CREATE POLICY "System can insert activity_logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- Trigger function: log task created
CREATE OR REPLACE FUNCTION public.log_task_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.created_by,
    'task_created',
    'task',
    NEW.id::text,
    jsonb_build_object('title', NEW.title, 'display_id', NEW.display_id, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_task_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_created();

-- Trigger function: log task status changed
CREATE OR REPLACE FUNCTION public.log_task_status_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (
      NULL,
      'task_status_changed',
      'task',
      NEW.id::text,
      jsonb_build_object('title', NEW.title, 'display_id', NEW.display_id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_task_status_changed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_status_changed();

-- Trigger function: log task assigned
CREATE OR REPLACE FUNCTION public.log_task_assigned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  task_title TEXT;
  task_display_id TEXT;
BEGIN
  SELECT title, display_id INTO task_title, task_display_id FROM public.tasks WHERE id = NEW.task_id;
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.user_id,
    'task_assigned',
    'task',
    NEW.task_id::text,
    jsonb_build_object('title', task_title, 'display_id', task_display_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_task_assigned
  AFTER INSERT ON public.task_assignees
  FOR EACH ROW EXECUTE FUNCTION public.log_task_assigned();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
