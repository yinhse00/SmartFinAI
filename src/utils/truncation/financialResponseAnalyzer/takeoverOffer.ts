
export function analyzeTakeoverOfferResponse(content: string) {
  const analysis = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low',
    diagnostics: {} as any
  };

  const lowerContent = content.toLowerCase();

  // Check for Takeovers Code references
  if (!lowerContent.includes('takeover') && !lowerContent.includes('code on takeover')) {
    analysis.isComplete = false;
    analysis.missingElements.push("CRITICAL: Takeover offer response missing Takeovers Code references");
    analysis.confidence = 'high';
  }

  // Check for incorrect Listing Rules Chapter 7 references
  if (lowerContent.includes('chapter 7') || lowerContent.includes('rule 7.')) {
    analysis.isComplete = false;
    analysis.missingElements.push("CRITICAL ERROR: Takeover offer response incorrectly references Listing Rules Chapter 7");
    analysis.confidence = 'high';
  }

  // Check for acquisition purpose
  if (!lowerContent.includes('acquisition') && !lowerContent.includes('control')) {
    analysis.isComplete = false;
    analysis.missingElements.push("CRITICAL: Missing acquisition/control purpose for Takeover offer under Takeovers Code");
    analysis.confidence = 'high';
  }

  return analysis;
}
