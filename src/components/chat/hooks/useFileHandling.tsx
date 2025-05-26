
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { useFileAttachments } from '@/hooks/useFileAttachments';
import { formatExtractedContent } from '@/utils/fileContentFormatter';

interface UseFileHandlingProps {
  input: string;
  setInput: (input: string) => void;
  executeOptimizedWorkflow: (query: string) => Promise<void>;
  lastUserMessageIsChinese: boolean;
}

/**
 * Hook to handle file processing and attachment functionality
 */
export const useFileHandling = ({
  input,
  setInput,
  executeOptimizedWorkflow,
  lastUserMessageIsChinese
}: UseFileHandlingProps) => {
  const { toast } = useToast();
  const { 
    processFiles, 
    isProcessing, 
    isOfflineMode, 
    tryReconnect 
  } = useFileProcessing();
  
  const { 
    attachedFiles, 
    handleFileSelect, 
    clearAttachedFiles, 
    removeAttachedFile, 
    hasAttachedFiles 
  } = useFileAttachments();

  // Show warning if in offline mode and there are attached files
  useEffect(() => {
    if (isOfflineMode && hasAttachedFiles) {
      toast({
        title: "Limited File Processing",
        description: "You're in offline mode. File processing will be limited.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [isOfflineMode, hasAttachedFiles, toast]);

  // Modified send handler that processes files before sending the message
  const handleSendWithFiles = async () => {
    if (hasAttachedFiles) {
      toast({
        title: lastUserMessageIsChinese ? "处理文件中" : "Processing files",
        description: lastUserMessageIsChinese 
          ? `正在处理 ${attachedFiles.length} 个文件，然后发送您的消息...` 
          : `Processing ${attachedFiles.length} file(s) before sending your message...`,
      });
      
      const processedResults = await processFiles(attachedFiles);
      
      // Format the extracted content to add to the input
      if (processedResults.length > 0) {
        const extractedContent = processedResults.map(result => result.content).join('\n\n');
        
        const separator = input ? '\n\n' : '';
        const enrichedInput = input + separator + extractedContent;
        
        // Use optimized workflow for faster processing
        await executeOptimizedWorkflow(enrichedInput);
        
        // Clear the files and input after sending
        clearAttachedFiles();
        setInput('');
      }
    } else {
      // Normal send without files
      await handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const query = input.trim();
    setInput('');
    
    // Use optimized workflow for faster processing
    await executeOptimizedWorkflow(query);
  };

  return {
    attachedFiles,
    handleFileSelect,
    removeAttachedFile,
    hasAttachedFiles,
    isProcessing,
    isOfflineMode,
    tryReconnect,
    handleSendWithFiles
  };
};
