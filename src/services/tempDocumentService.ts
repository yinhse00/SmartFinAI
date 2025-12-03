import { supabase } from '@/integrations/supabase/client';

export interface TempDocumentResponse {
  success: boolean;
  url: string;
  path: string;
  expiresIn: number;
}

/**
 * Service for handling temporary document uploads for Word protocol handler
 */
export const tempDocumentService = {
  /**
   * Upload a document to temporary storage and get a public URL
   * The document will auto-delete after 1 hour
   */
  async uploadTempDocument(blob: Blob, filename: string): Promise<TempDocumentResponse> {
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('filename', filename);

    const { data, error } = await supabase.functions.invoke('upload-temp-document', {
      body: formData,
    });

    if (error) {
      console.error('Failed to upload temp document:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to upload document');
    }

    return data as TempDocumentResponse;
  },

  /**
   * Launch Word Desktop with a document URL using the ms-word protocol
   * Returns true if the protocol was triggered, false otherwise
   */
  launchWordDesktop(documentUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const wordUri = `ms-word:ofe|u|${encodeURIComponent(documentUrl)}`;
        
        // Create a hidden iframe to trigger the protocol without navigating away
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = wordUri;
        document.body.appendChild(iframe);

        // Give Word time to launch, then clean up
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve(true);
        }, 2000);

      } catch (error) {
        console.error('Failed to launch Word:', error);
        resolve(false);
      }
    });
  },
};
