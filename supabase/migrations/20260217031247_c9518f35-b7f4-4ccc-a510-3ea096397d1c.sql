
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
  task_display_id TEXT;
  task_board_id TEXT;
BEGIN
  SELECT title, display_id, board_id INTO task_title, task_display_id, task_board_id FROM tasks WHERE id = NEW.task_id;
  
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'task_assigned',
    'Nova tarefa atribuída',
    task_display_id || ' · ' || task_title,
    '/board?board=' || task_board_id || '&task=' || NEW.task_id::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_task_created()
RETURNS TRIGGER AS $$
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
      '/board?board=' || NEW.board_id || '&task=' || NEW.id::text
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_task_status_change()
RETURNS TRIGGER AS $$
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
        '/board?board=' || NEW.board_id || '&task=' || NEW.id::text
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
