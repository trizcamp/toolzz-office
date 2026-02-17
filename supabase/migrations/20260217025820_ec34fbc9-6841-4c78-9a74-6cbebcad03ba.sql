
-- Auto-add task assignee as board member
CREATE OR REPLACE FUNCTION public.auto_add_board_member_on_assign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_board_id uuid;
BEGIN
  SELECT board_id INTO task_board_id FROM tasks WHERE id = NEW.task_id;
  
  IF task_board_id IS NOT NULL THEN
    INSERT INTO board_members (board_id, user_id)
    VALUES (task_board_id, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_assignee_add_board_member
AFTER INSERT ON public.task_assignees
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_board_member_on_assign();
