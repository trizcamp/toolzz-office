
CREATE OR REPLACE FUNCTION public.log_task_status_changed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (
      COALESCE(auth.uid(), NEW.created_by),
      'task_status_changed',
      'task',
      NEW.id::text,
      jsonb_build_object('title', NEW.title, 'display_id', NEW.display_id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$function$;
