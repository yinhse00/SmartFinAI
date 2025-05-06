// Empty arrays for the removed sample data
export const chapter13Data = [];
export const chapter14Data = [];
export const chapter14AData = [];

// Keep the structure but with empty data
export const moreDetailedRegulatoryData = {
  chapter13: chapter13Data,
  chapter14: chapter14Data,
  chapter14A: chapter14AData
};

// Function to generate a larger dataset for testing
export const generateLargeDataset = (baseData: any[], count: number) => {
  const result = [];
  
  for (let i = 0; i < count; i++) {
    const templateItem = baseData[i % baseData.length];
    const newItem = {
      ...templateItem,
      ruleNumber: `${templateItem.ruleNumber.split('.')[0]}.${(i + 1).toString().padStart(2, '0')}`,
      title: `${templateItem.title} - Variation ${i + 1}`,
      content: `${templateItem.content} Additional content for variation ${i + 1}.`,
      section: `${templateItem.section.split('.')[0]}.${(i + 1).toString().padStart(2, '0')}`,
    };
    result.push(newItem);
  }
  
  return result;
};

// Generate empty datasets for consistency with the rest of the codebase
export const largeChapter13Dataset = [];
export const largeChapter14Dataset = [];
export const largeChapter14ADataset = [];

// Combined dataset (also empty)
export const combinedRegulatoryDataset = [];
