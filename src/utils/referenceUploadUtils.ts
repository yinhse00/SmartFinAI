
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
): Promise<{ success: boolean; message: string; error?: any }> {
  if (files.length === 0) {
    console.log('No files provided for upload');
    return { success: false, message: "No files selected" };
  }

  if (!category) {
    console.log('No category provided for upload');
    return { success: false, message: "Category required" };
  }

  try {
    console.log('Starting upload of', files.length, 'files to category:', category);
    
    // Check if references bucket exists - no longer attempting to create it
    // since that requires admin privileges
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket('references');
    
    if (bucketError) {
      console.error('Error checking bucket existence:', bucketError);
      
      // Instead of creating bucket (which requires admin privileges),
      // inform the user about the issue
      if (bucketError.message.includes('not found')) {
        console.error('References bucket not found');
        throw new Error('The storage bucket for references does not exist. Please contact an administrator to create it.');
      } else {
        throw new Error(`Error accessing storage: ${bucketError.message}`);
      }
    } else {
      console.log('References bucket exists');
    }
    
    // Upload files to Supabase storage
    const uploadedFiles: UploadedFile[] = [];
    const failedUploads: { name: string, error: string }[] = [];
    
    for (const file of files) {
      console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
      
      // Validate file size
      if (file.size > 20971520) { // 20MB
        console.error(`File too large: ${file.name}`);
        failedUploads.push({ name: file.name, error: 'File exceeds 20MB limit' });
        continue;
      }
      
      // Validate file type
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(fileExt || '')) {
        console.error(`Invalid file type: ${file.name}`);
        failedUploads.push({ name: file.name, error: 'Invalid file type. Only PDF, DOCX, and TXT are supported.' });
        continue;
      }
      
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${category}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('references')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error('Error uploading file:', file.name, error);
        failedUploads.push({ name: file.name, error: error.message });
        continue;
      }
      
      console.log('File uploaded successfully:', file.name);
      
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
    
    if (uploadedFiles.length === 0) {
      return { 
        success: false, 
        message: `Failed to upload files. ${failedUploads.map(f => `${f.name}: ${f.error}`).join(', ')}` 
      };
    }
    
    console.log('Saving metadata to database for', uploadedFiles.length, 'files');
    
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
    
    // Handle partial success
    if (failedUploads.length > 0) {
      return { 
        success: true, 
        message: `Successfully uploaded ${uploadedFiles.length} file(s). Failed to upload ${failedUploads.length} file(s).` 
      };
    }
    
    return { 
      success: true, 
      message: `${uploadedFiles.length} document(s) have been uploaded and are being processed.` 
    };
  } catch (error) {
    console.error('Unhandled upload error:', error);
    
    let errorMessage = "There was an error uploading your references. Please try again.";
    if (error instanceof Error) {
      errorMessage = `Upload failed: ${error.message}`;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      error: error
    };
  }
}
