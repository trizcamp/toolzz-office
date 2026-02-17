
CREATE OR REPLACE FUNCTION public.notify_meeting_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  meeting_title TEXT;
  meeting_date DATE;
  meeting_code TEXT;
BEGIN
  SELECT title, date, meeting_code INTO meeting_title, meeting_date, meeting_code
  FROM meetings WHERE id = NEW.meeting_id;

  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'meeting_invite',
    'Convite para reunião',
    meeting_title || ' · ' || to_char(meeting_date, 'DD/MM/YYYY'),
    '/meetings/' || COALESCE(meeting_code, NEW.meeting_id::text)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_meeting_participant_added
AFTER INSERT ON public.meeting_participants
FOR EACH ROW
EXECUTE FUNCTION public.notify_meeting_participant();
