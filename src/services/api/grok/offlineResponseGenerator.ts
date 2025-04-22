
export const offlineResponseGenerator = {
  generateOfflineResponseFormat: (prompt: string, error: any): any => {
    // Get detailed error information for better debugging
    let errorMessage = "network error";
    let errorType = "unknown";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.name;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }
    
    // Check for specific error patterns
    const isCorsError = 
      errorMessage.includes('CORS') || 
      errorMessage.includes('origin') ||
      errorMessage.includes('cross') ||
      errorMessage.includes('Access-Control');
      
    const isNetworkError =
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('Network Error') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('abort');
      
    const isAuthError =
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('invalid key');
    
    // Create appropriate message based on error type
    let diagnosisMessage = "";
    let troubleshootingTips = "";
    
    if (isCorsError) {
      diagnosisMessage = "This appears to be a CORS (Cross-Origin Resource Sharing) issue. The API server is not allowing requests from this domain.";
      troubleshootingTips = "Try using a CORS proxy service or accessing this application from a different network environment. The Grok API may have restrictions on which domains can access it directly from browsers.";
    } else if (isNetworkError) {
      diagnosisMessage = "This appears to be a network connectivity issue.";
      troubleshootingTips = "Please check your internet connection and ensure that there are no firewall or proxy settings blocking access to the Grok API endpoints. If you're on a corporate network, VPN, or using browser privacy extensions, try disabling them temporarily.";
    } else if (isAuthError) {
      diagnosisMessage = "This appears to be an authentication issue.";
      troubleshootingTips = "Please verify your API key is valid and has not expired. You can check this by trying the key in a different application or the official Grok API documentation.";
    }

    const offlineMessage = `I'm currently operating in offline mode because the Grok API is unreachable (${errorType}: ${errorMessage}). 
    
${diagnosisMessage}

${troubleshootingTips}

I can still provide general information about Hong Kong listing rules and financial regulations based on my core knowledge, but I cannot access the specialized regulatory database for detailed citations and rule references at this moment.

Please try again later when the API connection is restored for more detailed and specific guidance.

Regarding your question: "${prompt ? prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '') : 'your query'}"

While I can't provide specific rule citations in offline mode, I can offer general guidance based on my understanding of Hong Kong financial regulations. However, for specific regulatory advice and official interpretations, please refer to the official HKEX and SFC documentation when making financial or regulatory decisions.`;

    return {
      id: `offline-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "offline-fallback-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: offlineMessage
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      system_fingerprint: null
    };
  }
};
