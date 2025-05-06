
// Empty arrays for the removed sample data
export const chapter13Data = [];
export const chapter14Data = [
  {
    ruleNumber: "14.01",
    title: "Preliminary",
    content: "This Chapter deals with certain transactions, principally acquisitions and disposals, by a listed issuer. It describes how they are classified, the details that are required to be disclosed in respect of them and whether they require shareholders' approval. It also considers additional requirements in respect of takeovers and mergers.",
    chapter: "Chapter 14",
    section: "14.01",
    categoryCode: "CH14"
  },
  {
    ruleNumber: "14.02",
    title: "Application of Chapter 14",
    content: "This Chapter applies to acquisitions and disposals by a listed issuer. This includes acquisition and disposal of any interest in any other company or entity, as well as transactions in relation to real estate, and even where the transaction is entered into by the listed issuer's subsidiaries.",
    chapter: "Chapter 14",
    section: "14.02",
    categoryCode: "CH14"
  },
  {
    ruleNumber: "14.06",
    title: "Classification and explanation of terms",
    content: "A listed issuer must determine the classification of a transaction using the percentage ratios set out in rule 14.07. The classifications are:— (1) share transaction — an acquisition of assets (excluding cash) by a listed issuer where the consideration includes securities for which listing will be sought and where all percentage ratios are less than 5%; (2) discloseable transaction — a transaction or a series of transactions (aggregated under rules 14.22 and 14.23) by a listed issuer where any percentage ratio is 5% or more, but less than 25%; (3) major transaction — a transaction or a series of transactions (aggregated under rules 14.22 and 14.23) by a listed issuer where any percentage ratio is 25% or more, but less than 100% for an acquisition or 75% for a disposal; (4) very substantial disposal — a disposal or a series of disposals (aggregated under rules 14.22 and 14.23) of assets (including deemed disposals referred to in rule 14.29) by a listed issuer where any percentage ratio is 75% or more; (5) very substantial acquisition — an acquisition or a series of acquisitions (aggregated under rules 14.22 and 14.23) of assets by a listed issuer where any percentage ratio is 100% or more; (6) reverse takeover — an acquisition or a series of acquisitions of assets by a listed issuer which, in the opinion of the Exchange, constitutes, or is part of a transaction or arrangement or series of transactions or arrangements which constitute, an attempt to achieve a listing of the assets to be acquired and a means to circumvent the requirements for new applicants set out in Chapter 8 of the Listing Rules.",
    chapter: "Chapter 14",
    section: "14.06",
    categoryCode: "CH14"
  },
  {
    ruleNumber: "14.07",
    title: "Percentage ratios",
    content: "The percentage ratios are the figures, expressed as percentages resulting from each of the following calculations:— (1) Assets ratio — the total assets which are the subject of the transaction divided by the total assets of the listed issuer; (2) Profits ratio — the profits attributable to the assets which are the subject of the transaction divided by the profits of the listed issuer; (3) Revenue ratio — the revenue attributable to the assets which are the subject of the transaction divided by the revenue of the listed issuer; (4) Consideration ratio — the consideration divided by the total market capitalisation of the listed issuer. The total market capitalisation is the average closing price of the listed issuer's securities as stated in the Exchange's daily quotations sheets for the five business days immediately preceding the date of the transaction; and (5) Equity capital ratio — the number of shares to be issued by the listed issuer as consideration divided by the total number of the listed issuer's issued shares immediately before the transaction.",
    chapter: "Chapter 14",
    section: "14.07",
    categoryCode: "CH14"
  },
  {
    ruleNumber: "14.22",
    title: "Aggregation of transactions",
    content: "In addition to the circumstances stated in rule 14.06(6)(b), the Exchange may require listed issuers to aggregate a series of transactions and treat them as if they were one transaction if they are all completed within a 12 month period or are otherwise related. In such cases, the listed issuer must comply with the requirements for the relevant classification of the transaction when aggregated and the figures to be used for determining the percentage ratios are those as shown in the listed issuer's accounts for the relevant period.",
    chapter: "Chapter 14",
    section: "14.22",
    categoryCode: "CH14"
  }
];
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

// Generate larger datasets based on our sample data
export const largeChapter13Dataset = [];
export const largeChapter14Dataset = generateLargeDataset(chapter14Data, 20);
export const largeChapter14ADataset = [];

// Combined dataset
export const combinedRegulatoryDataset = [
  ...chapter13Data,
  ...chapter14Data,
  ...chapter14AData
];
