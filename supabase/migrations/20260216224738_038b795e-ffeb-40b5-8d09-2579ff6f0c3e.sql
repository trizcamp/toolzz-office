
-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

-- Allow public read access
CREATE POLICY "Public can read chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');
