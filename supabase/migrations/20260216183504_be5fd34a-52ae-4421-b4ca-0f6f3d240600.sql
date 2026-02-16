
-- Fix documents RLS: change restrictive policies to permissive
DROP POLICY IF EXISTS "Authenticated can read documents" ON public.documents;
CREATE POLICY "Authenticated can read documents" ON public.documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert documents" ON public.documents;
CREATE POLICY "Authenticated can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated can update documents" ON public.documents;
CREATE POLICY "Authenticated can update documents" ON public.documents FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can delete documents" ON public.documents;
CREATE POLICY "Authenticated can delete documents" ON public.documents FOR DELETE TO authenticated USING (true);

-- Fix document_blocks RLS
DROP POLICY IF EXISTS "Authenticated can manage document_blocks" ON public.document_blocks;
CREATE POLICY "Authenticated can manage document_blocks" ON public.document_blocks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fix document_comments RLS
DROP POLICY IF EXISTS "Authenticated can manage document_comments" ON public.document_comments;
CREATE POLICY "Authenticated can manage document_comments" ON public.document_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
