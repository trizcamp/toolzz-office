
-- Add meeting_code for shareable links and status tracking
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS meeting_code TEXT UNIQUE;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS description TEXT;

-- Generate unique meeting code for new meetings
CREATE OR REPLACE FUNCTION public.generate_meeting_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.meeting_code IS NULL THEN
    NEW.meeting_code := lower(substr(md5(random()::text || clock_timestamp()::text), 1, 3) || '-' || substr(md5(random()::text), 1, 4) || '-' || substr(md5(clock_timestamp()::text), 1, 3));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_meeting_code
  BEFORE INSERT ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_meeting_code();

-- Backfill existing meetings
UPDATE public.meetings SET meeting_code = lower(substr(md5(random()::text || id::text), 1, 3) || '-' || substr(md5(id::text), 1, 4) || '-' || substr(md5(random()::text), 1, 3)) WHERE meeting_code IS NULL;
