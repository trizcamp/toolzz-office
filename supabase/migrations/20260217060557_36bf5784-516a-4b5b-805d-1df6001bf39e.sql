
CREATE OR REPLACE FUNCTION public.notify_meeting_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_meeting_title TEXT;
  v_meeting_date DATE;
  v_meeting_code TEXT;
BEGIN
  SELECT m.title, m.date, m.meeting_code 
  INTO v_meeting_title, v_meeting_date, v_meeting_code
  FROM meetings m WHERE m.id = NEW.meeting_id;

  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'meeting_invite',
    '📅 Convite para reunião',
    v_meeting_title || ' · ' || to_char(v_meeting_date, 'DD/MM/YYYY'),
    '/meetings/' || COALESCE(v_meeting_code, NEW.meeting_id::text)
  );
  RETURN NEW;
END;
$$;
