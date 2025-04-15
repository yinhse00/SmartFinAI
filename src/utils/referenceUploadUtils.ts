
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
    console.log('Starting upload of', files.length, 'files to category:', category);
    
    // Check if references bucket exists, create if not
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket('references');
    
    if (bucketError && bucketError.message.includes('not found')) {
      console.log('References bucket not found, creating it...');
      const { error: createError } = await supabase.storage.createBucket('references', {
        public: false,
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        fileSizeLimit: 20971520 // 20MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        throw new Error(`Error creating storage bucket: ${createError.message}`);
      }
    }
    
    // Upload files to Supabase storage
    const uploadedFiles: UploadedFile[] = [];
    
    for (const file of files) {
      console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
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
      
      console.log('File uploaded successfully, getting public URL');
      
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
    
    console.log('All files uploaded, saving metadata to database');
    
    // Store metadata in Supabase
    const { error: metadataError } = await supabase
      .from('reference_documents')
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
    
    console.log('Upload complete, files:', uploadedFiles.length);
    
    return { 
      success: true, 
      message: `${files.length} document(s) have been uploaded and are being processed.` 
    };
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more detailed error message
    let errorMessage = "There was an error uploading your references. Please try again.";
    if (error instanceof Error) {
      errorMessage = `Upload failed: ${error.message}`;
    }
    
    toast({
      title: "Upload failed",
      description: errorMessage,
      variant: "destructive",
    });
    
    return { 
      success: false, 
      message: errorMessage
    };
  }
}
