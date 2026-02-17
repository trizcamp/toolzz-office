
-- Add existing board creators as members
INSERT INTO board_members (board_id, user_id)
SELECT id, created_by FROM boards WHERE created_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add all distinct task creators as board members
INSERT INTO board_members (board_id, user_id)
SELECT DISTINCT board_id, created_by FROM tasks WHERE created_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create trigger to auto-add board creator as member
CREATE OR REPLACE FUNCTION public.auto_add_board_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO board_members (board_id, user_id)
    VALUES (NEW.id, NEW.created_by)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_board_created_add_member
  AFTER INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_board_creator();

-- Also auto-add task creator as board member
CREATE OR REPLACE FUNCTION public.auto_add_task_creator_to_board()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO board_members (board_id, user_id)
    VALUES (NEW.board_id, NEW.created_by)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_created_add_creator_to_board
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_task_creator_to_board();

-- Add unique constraint to prevent duplicates
ALTER TABLE board_members ADD CONSTRAINT board_members_board_user_unique UNIQUE (board_id, user_id);
