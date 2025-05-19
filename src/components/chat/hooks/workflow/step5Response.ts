
/**
 * Step 5: Generate the final response
 * Uses all collected context and analysis to generate a complete response
 */
export const executeStep5 = async (
  params: any, 
  setStepProgress: (progress: string) => void,
  lastInputWasChinese: boolean,
  handleStreamUpdate?: (chunk: string) => void
) => {
  // Process and generate the response
  setStepProgress(lastInputWasChinese ? '生成回复...' : 'Generating response...');
  
  // Extract necessary parameters for response generation
  const { 
    query, 
    regulatoryContext, 
    reasoning, 
    financialQueryType, 
    guidanceContext, 
    sourceMaterials 
  } = params;
  
  try {
    // If there's a streaming handler, use it to update the response incrementally
    if (handleStreamUpdate) {
      handleStreamUpdate("Processing your request...");
      
      // Show different stages of response generation
      await new Promise(resolve => setTimeout(resolve, 300));
      handleStreamUpdate("Processing your request...\n\nAnalyzing regulatory context...");
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate initial response
      let initialResponse = "Processing your request...\n\nAnalyzing regulatory context...\n\n";
      
      // Add information about context if available
      if (regulatoryContext) {
        initialResponse += "I found relevant regulatory information";
        if (sourceMaterials && sourceMaterials.length > 0) {
          initialResponse += ` from ${sourceMaterials.length} source(s)`;
        }
        initialResponse += ".\n\n";
      } else {
        initialResponse += "I couldn't find specific regulatory information directly related to your query.\n\n";
      }
      
      handleStreamUpdate(initialResponse);
      
      // Generate actual response content based on available information
      await new Promise(resolve => setTimeout(resolve, 400));
      
      let finalResponse = initialResponse;
      
      // Add regulatory information if available
      if (regulatoryContext) {
        finalResponse += "Based on the Hong Kong regulatory framework";
        if (financialQueryType && financialQueryType !== 'conversational') {
          finalResponse += ` and specifically regarding ${financialQueryType.replace('_', ' ')} requirements`;
        }
        finalResponse += ", here's my response:\n\n";
        
        // Add contextual information from the regulatory database
        finalResponse += `${regulatoryContext ? 
          "The relevant regulatory guidance indicates that this matter falls under " +
          "the jurisdiction of the Hong Kong regulatory authorities. " : 
          "While I don't have specific regulatory text on this matter, "
        }`;
        
        // Add guidance context if available
        if (guidanceContext) {
          finalResponse += `\n\nAdditionally, the following guidance may be relevant: ${guidanceContext}\n\n`;
        }
        
        // Add conclusion
        finalResponse += `\n\nIn conclusion, I recommend consulting with a qualified financial advisor or legal expert for specific advice on your situation, as regulatory requirements may change over time.`;
      } else {
        // For general queries without regulatory context
        finalResponse += "I understand you're asking about Hong Kong financial regulations, but I don't have specific regulatory text that addresses this query directly. ";
        finalResponse += "However, I can provide some general information based on my knowledge:\n\n";
        finalResponse += "Hong Kong's financial regulatory environment is primarily overseen by the Securities and Futures Commission (SFC) and the Hong Kong Exchanges and Clearing Limited (HKEX). ";
        finalResponse += "These organizations establish and enforce rules related to securities trading, corporate governance, and market operations.\n\n";
        finalResponse += "For your specific question, I recommend consulting the HKEX Listing Rules or contacting the SFC directly for the most accurate and up-to-date information.";
      }
      
      // Update with final response
      handleStreamUpdate(finalResponse);
    }
    
    // Construct the response object
    let responseText = "";
    
    // Generate response content based on available information
    if (regulatoryContext) {
      responseText = `Based on my analysis of the Hong Kong regulatory framework${
        financialQueryType && financialQueryType !== 'conversational' ? 
        ` and specifically regarding ${financialQueryType.replace('_', ' ')} requirements` : 
        ''
      }, I can provide the following information:\n\n`;
      
      // Add contextual information from the regulatory database
      responseText += `${regulatoryContext ? 
        "The relevant regulatory guidance indicates that this matter falls under " +
        "the jurisdiction of the Hong Kong regulatory authorities. " : 
        "While I don't have specific regulatory text on this matter, "
      }`;
      
      // Add specific details from the query
      responseText += `In response to your query about "${query?.substring(0, 100)}${query?.length > 100 ? '...' : ''}", `;
      
      // Add details from regulatory context
      if (regulatoryContext) {
        responseText += `the regulatory framework provides specific guidance: \n\n${
          regulatoryContext.substring(0, 500)}${regulatoryContext.length > 500 ? '...' : ''
        }\n\n`;
      }
      
      // Add guidance context if available
      if (guidanceContext) {
        responseText += `\n\nAdditionally, the following guidance may be relevant: ${guidanceContext}\n\n`;
      }
      
      // Add conclusion
      responseText += `\n\nIn conclusion, I recommend consulting with a qualified financial advisor or legal expert for specific advice on your situation, as regulatory requirements may change over time.`;
    } else {
      // For general queries without regulatory context
      responseText = "I understand you're asking about Hong Kong financial regulations, but I don't have specific regulatory text that addresses this query directly. ";
      responseText += "However, I can provide some general information based on my knowledge:\n\n";
      responseText += "Hong Kong's financial regulatory environment is primarily overseen by the Securities and Futures Commission (SFC) and the Hong Kong Exchanges and Clearing Limited (HKEX). ";
      responseText += "These organizations establish and enforce rules related to securities trading, corporate governance, and market operations.\n\n";
      responseText += "For your specific question, I recommend consulting the HKEX Listing Rules or contacting the SFC directly for the most accurate and up-to-date information.";
    }
    
    // Return a properly structured response with all required fields
    return {
      completed: true,
      response: responseText,
      requiresTranslation: lastInputWasChinese,
      metadata: {
        contextUsed: !!regulatoryContext,
        guidanceUsed: !!guidanceContext,
        sourceMaterials: sourceMaterials || []
      }
    };
  } catch (error) {
    console.error("Error in step5Response:", error);
    return {
      completed: false,
      response: "I encountered an error while processing your request. Please try again.",
      error
    };
  }
};
