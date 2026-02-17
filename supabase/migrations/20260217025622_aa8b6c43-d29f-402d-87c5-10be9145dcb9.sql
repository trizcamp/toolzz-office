
-- Create a function to notify all board members when a task is created
CREATE OR REPLACE FUNCTION public.notify_task_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  board_member RECORD;
BEGIN
  FOR board_member IN 
    SELECT user_id FROM board_members WHERE board_id = NEW.board_id AND user_id != NEW.created_by
  LOOP
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      board_member.user_id,
      'task_created',
      'Nova tarefa criada',
      NEW.display_id || ' · ' || NEW.title,
      '/board'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_task_created_notify
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_created();
