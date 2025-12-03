-- Create temp-documents storage bucket for temporary document hosting
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-documents', 'temp-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Temp documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp-documents');

-- Create policy for authenticated uploads
CREATE POLICY "Authenticated users can upload temp documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'temp-documents');

-- Create policy for service role delete (for cleanup)
CREATE POLICY "Service role can delete temp documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'temp-documents');