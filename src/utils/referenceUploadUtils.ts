
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface UploadedFile {
  name: string;
  category: string;
  description: string;
  path: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export async function uploadFilesToSupabase(
  files: File[],
  category: string,
  description: string
): Promise<{ success: boolean; message: string }> {
  if (files.length === 0) {
    toast({
      title: "No files selected",
      description: "Please select at least one file to upload.",
      variant: "destructive",
    });
    return { success: false, message: "No files selected" };
  }

  if (!category) {
    toast({
      title: "Category required",
      description: "Please select a category for the documents.",
      variant: "destructive",
    });
    return { success: false, message: "Category required" };
  }

  try {
    // Upload files to Supabase storage
    const uploadedFiles: UploadedFile[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${category}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('references')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error('Error uploading reference:', error);
        throw new Error(`Error uploading ${file.name}: ${error.message}`);
      }
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('references')
        .getPublicUrl(filePath);
        
      uploadedFiles.push({
        name: file.name,
        category: category,
        description: description,
        path: filePath,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      });
    }
    
    // Store metadata in Supabase
    const { error: metadataError } = await supabase
      .from('reference_documents' as any)
      .insert(uploadedFiles.map(file => ({
        title: file.name,
        category: file.category,
        description: file.description,
        file_path: file.path,
        file_url: file.url,
        file_size: file.size,
        file_type: file.type
      })));
    
    if (metadataError) {
      console.error('Error storing metadata:', metadataError);
      throw new Error(`Error saving document metadata: ${metadataError.message}`);
    }
    
    return { 
      success: true, 
      message: `${files.length} document(s) have been uploaded and are being processed.` 
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      message: "There was an error uploading your references. Please try again." 
    };
  }
}
