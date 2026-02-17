
-- Fix the boards SELECT RLS policy - the join condition was wrong (bm.board_id = bm.id instead of bm.board_id = boards.id)
DROP POLICY IF EXISTS "Users can read their boards" ON public.boards;

CREATE POLICY "Users can read their boards"
ON public.boards
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM board_members bm
    WHERE bm.board_id = boards.id AND bm.user_id = auth.uid()
  )
);
