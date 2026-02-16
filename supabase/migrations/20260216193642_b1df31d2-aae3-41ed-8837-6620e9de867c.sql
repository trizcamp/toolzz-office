
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications (service role)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to notify on task assignment
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_title TEXT;
  task_display_id TEXT;
  assigner_name TEXT;
BEGIN
  SELECT title, display_id INTO task_title, task_display_id FROM tasks WHERE id = NEW.task_id;
  
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'task_assigned',
    'Nova tarefa atribuída',
    task_display_id || ' · ' || task_title,
    '/board'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_assigned
  AFTER INSERT ON public.task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned();

-- Function to notify on task status change
CREATE OR REPLACE FUNCTION public.notify_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assignee RECORD;
  status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'todo' THEN status_label := 'To Do';
      WHEN 'in_progress' THEN status_label := 'Em Progresso';
      WHEN 'review' THEN status_label := 'Em Revisão';
      WHEN 'done' THEN status_label := 'Concluído';
      ELSE status_label := NEW.status;
    END CASE;

    FOR assignee IN SELECT user_id FROM task_assignees WHERE task_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (
        assignee.user_id,
        'task_status',
        'Status atualizado → ' || status_label,
        NEW.display_id || ' · ' || NEW.title,
        '/board'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_status_change
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_status_change();
