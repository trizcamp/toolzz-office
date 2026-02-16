
-- Create board_members junction table
CREATE TABLE public.board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read board memberships
CREATE POLICY "Authenticated can read board_members"
  ON public.board_members FOR SELECT
  USING (true);

-- Only admins can manage board members
CREATE POLICY "Admins can insert board_members"
  ON public.board_members FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete board_members"
  ON public.board_members FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update boards SELECT policy: admins see all, members see only their boards
DROP POLICY IF EXISTS "Authenticated can read boards" ON public.boards;
CREATE POLICY "Users can read their boards"
  ON public.boards FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.board_members bm
      WHERE bm.board_id = id AND bm.user_id = auth.uid()
    )
  );

-- Update boards INSERT policy: only admins can create boards
DROP POLICY IF EXISTS "Authenticated can insert boards" ON public.boards;
CREATE POLICY "Admins can insert boards"
  ON public.boards FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

-- Update boards UPDATE policy: only admins
DROP POLICY IF EXISTS "Authenticated can update boards" ON public.boards;
CREATE POLICY "Admins can update boards"
  ON public.boards FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update tasks INSERT policy: only admins can create tasks
DROP POLICY IF EXISTS "Authenticated can insert tasks" ON public.tasks;
CREATE POLICY "Admins can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

-- Update tasks DELETE policy: only admins
DROP POLICY IF EXISTS "Authenticated can delete tasks" ON public.tasks;
CREATE POLICY "Admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage user_roles (already exists, but ensure update too)
-- Allow admins to delete members
CREATE POLICY "Admins can delete members"
  ON public.members FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
