
/**
 * Service for streaming responses to improve perceived performance
 */
export const responseStreamingService = {
  /**
   * Create a streaming response that updates progressively
   */
  createStreamingResponse: (initialContent: string = '') => {
    let currentContent = initialContent;
    const listeners: ((content: string) => void)[] = [];
    
    return {
      // Add content incrementally
      appendContent: (newContent: string) => {
        currentContent += newContent;
        listeners.forEach(listener => listener(currentContent));
      },
      
      // Replace entire content
      setContent: (content: string) => {
        currentContent = content;
        listeners.forEach(listener => listener(currentContent));
      },
      
      // Subscribe to content updates
      onUpdate: (callback: (content: string) => void) => {
        listeners.push(callback);
        // Return current content immediately
        callback(currentContent);
        
        // Return unsubscribe function
        return () => {
          const index = listeners.indexOf(callback);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        };
      },
      
      // Get current content
      getCurrentContent: () => currentContent,
      
      // Mark as complete
      complete: () => {
        // Final update to all listeners
        listeners.forEach(listener => listener(currentContent));
      }
    };
  },
  
  /**
   * Simulate progressive loading for better UX
   */
  simulateProgressiveLoading: (targetContent: string, onUpdate: (content: string) => void) => {
    if (!targetContent || targetContent.length === 0) {
      onUpdate('');
      return;
    }
    
    // Split content into chunks for progressive display
    const chunks = targetContent.split('\n\n');
    let currentContent = '';
    
    chunks.forEach((chunk, index) => {
      setTimeout(() => {
        currentContent += (index > 0 ? '\n\n' : '') + chunk;
        onUpdate(currentContent);
      }, index * 100); // 100ms delay between chunks
    });
  }
};
