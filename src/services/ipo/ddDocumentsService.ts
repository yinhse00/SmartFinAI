import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { IPODDDocument } from '@/types/ipo';

export type DDDocumentType = 'financial' | 'legal' | 'business' | 'technical' | 'market';

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function detectType(file: File): DDDocumentType {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (/(xlsx|xls|sheet|csv)/.test(name) || /spreadsheet|excel/.test(type)) return 'financial';
  if (/pdf/.test(type) && /(financial|statement|fs|account)/.test(name)) return 'financial';
  if (/(ppt|pptx)/.test(name)) return 'business';
  if (/word|msword|officedocument/.test(type)) return 'business';
  return 'business';
}

export const ddDocumentsService = {
  async list(projectId: string, opts?: { document_type?: DDDocumentType }) {
    let query = supabase.from('ipo_dd_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (opts?.document_type) query = query.eq('document_type', opts.document_type);
    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as IPODDDocument[];
  },

  async upload(projectId: string, file: File, opts?: { document_type?: DDDocumentType }) {
    const bucket = 'ipo-dd';
    const docType: DDDocumentType = opts?.document_type || detectType(file);
    const id = uuidv4();
    const path = `${projectId}/${id}-${sanitizeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, cacheControl: '3600' });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('ipo_dd_documents')
      .insert({
        id,
        project_id: projectId,
        document_name: file.name,
        document_type: docType,
        file_path: path,
        file_url: `/${bucket}/${path}`,
        processing_status: 'pending',
        key_insights: [],
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as unknown as IPODDDocument;
  },

  async remove(doc: Pick<IPODDDocument, 'id' | 'file_path'>) {
    if (doc.file_path) {
      await supabase.storage.from('ipo-dd').remove([doc.file_path]);
    }
    const { error } = await supabase.from('ipo_dd_documents').delete().eq('id', doc.id);
    if (error) throw error;
    return true;
  }
};
