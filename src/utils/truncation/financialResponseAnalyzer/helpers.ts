
export function isExecutionProcessContent(content: string): boolean {
  const executionTerms = [
    'execution process', 
    'working process', 
    'execution timeline', 
    'preparation steps',
    'execution steps',
    'timetable execution'
  ];

  const normalizedContent = content.toLowerCase();

  return executionTerms.some(term => normalizedContent.includes(term));
}
