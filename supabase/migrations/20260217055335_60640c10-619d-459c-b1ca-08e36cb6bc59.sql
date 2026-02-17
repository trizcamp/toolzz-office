
-- Create document_folders table
CREATE TABLE public.document_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read document_folders"
  ON public.document_folders FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert document_folders"
  ON public.document_folders FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated can update document_folders"
  ON public.document_folders FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated can delete document_folders"
  ON public.document_folders FOR DELETE
  USING (auth.uid() = created_by);

-- Add folder_id column to documents
ALTER TABLE public.documents ADD COLUMN folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL;
