import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, FileText, Loader2 } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ddDocumentsService, DDDocumentType } from '@/services/ipo/ddDocumentsService';
import { IPODDDocument } from '@/types/ipo';
import { useToast } from '@/hooks/use-toast';

interface SupportingDocumentsUploaderProps {
  projectId: string;
  sectionType: string;
  documentType?: DDDocumentType; // defaults based on sectionType
  onChange?: (ids: string[]) => void;
}

export const SupportingDocumentsUploader: React.FC<SupportingDocumentsUploaderProps> = ({
  projectId,
  sectionType,
  documentType,
  onChange
}) => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<IPODDDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const inferredType: DDDocumentType = useMemo(() => {
    if (documentType) return documentType;
    return (sectionType || '').toLowerCase().includes('financial') ? 'financial' : 'business';
  }, [documentType, sectionType]);

  const { validateFiles } = useFileUpload();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await ddDocumentsService.list(projectId, { document_type: inferredType });
        setDocs(list);
        onChange?.(list.map(d => d.id));
      } catch (e: any) {
        toast({ title: 'Failed to load documents', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    if (projectId) load();
  }, [projectId, inferredType]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!validateFiles(files)) return;
    setUploading(true);
    try {
      const uploaded: IPODDDocument[] = [];
      for (const file of Array.from(files)) {
        const doc = await ddDocumentsService.upload(projectId, file, { document_type: inferredType });
        uploaded.push(doc);
      }
      const newDocs = [...uploaded, ...docs];
      setDocs(newDocs);
      onChange?.(newDocs.map(d => d.id));
      toast({ title: 'Documents uploaded', description: `${uploaded.length} file(s) added.` });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = async (doc: IPODDDocument) => {
    try {
      await ddDocumentsService.remove({ id: doc.id, file_path: doc.file_path });
      const newDocs = docs.filter(d => d.id !== doc.id);
      setDocs(newDocs);
      onChange?.(newDocs.map(d => d.id));
      toast({ title: 'Removed', description: `${doc.document_name} removed.` });
    } catch (e: any) {
      toast({ title: 'Remove failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" /> Supporting Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Upload {inferredType === 'financial' ? 'financial statements/reports' : 'due diligence documents'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Select Files
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Uploaded ({docs.length})</h4>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>
          ) : (
            <ul className="divide-y border rounded-md">
              {docs.map(doc => (
                <li key={doc.id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="truncate">
                      <div className="text-sm truncate">{doc.document_name}</div>
                      <div className="text-xs text-muted-foreground">{doc.document_type} • {doc.processing_status}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeDoc(doc)} aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
