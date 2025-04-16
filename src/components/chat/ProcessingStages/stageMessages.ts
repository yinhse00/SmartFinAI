
// Helper functions to get stage-specific messages

export const getStageMessages = (currentStage: string): string[] => {
  switch(currentStage) {
    case 'preparing':
      return [
        'Analyzing query parameters...',
        'Searching regulatory database...',
        'Extracting relevant context...',
        'Preparing contextual information...',
        'Setting up financial regulatory framework...'
      ];
    case 'reviewing':
      return [
        'Reviewing comprehensive database...',
        'Cross-referencing regulatory documents...',
        'Checking FAQ and guidance documents...',
        'Verifying against 10.4 FAQ Continuing Obligations...',
        'Ensuring all relevant information is consulted...'
      ];
    case 'processing':
      return [
        'Analyzing financial regulations...',
        'Processing regulatory context...',
        'Generating technical analysis...',
        'Applying context to response...',
        'Preparing comprehensive explanation...',
        'Generating financial comparisons...',
        'Adding regulatory context to response...',
        'Checking for truncation prevention...',
        'Optimizing token usage for completeness...',
        'Ensuring response completeness...'
      ];
    case 'finalizing':
      return [
        'Validating response accuracy...',
        'Performing quality checks...',
        'Formatting financial information...',
        'Adding final details...',
        'Preparing delivery...'
      ];
    default:
      return ['Processing...'];
  }
};
