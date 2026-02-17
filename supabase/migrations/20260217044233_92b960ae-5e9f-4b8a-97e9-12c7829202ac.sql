-- Update notify_task_created to also notify the task creator
CREATE OR REPLACE FUNCTION public.notify_task_created()
RETURNS TRIGGER AS $$
DECLARE
  board_member RECORD;
BEGIN
  -- Notify ALL board members including the creator
  FOR board_member IN 
    SELECT user_id FROM board_members WHERE board_id = NEW.board_id
  LOOP
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      board_member.user_id,
      'task_created',
      'Nova tarefa criada',
      NEW.display_id || ' · ' || NEW.title,
      '/board?board=' || NEW.board_id || '&task=' || NEW.id::text
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;