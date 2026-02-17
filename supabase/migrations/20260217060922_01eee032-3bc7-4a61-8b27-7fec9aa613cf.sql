
-- Add RSVP status to meeting_participants
ALTER TABLE public.meeting_participants 
ADD COLUMN status text NOT NULL DEFAULT 'pending',
ADD COLUMN responded_at timestamp with time zone;

-- Add suggested_date for reschedule requests
ALTER TABLE public.meeting_participants
ADD COLUMN suggested_date date,
ADD COLUMN suggested_time time without time zone;
