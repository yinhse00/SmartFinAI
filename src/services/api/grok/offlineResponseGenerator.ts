
export const offlineResponseGenerator = {
  generateOfflineResponseFormat: (prompt: string, error: any): any => {
    const offlineMessage = `I'm currently operating in offline mode because the Grok API is unreachable (${error instanceof Error ? error.message : 'network error'}). 
    
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

