
/**
 * Simple language detector for Chinese text
 */
export function isChineseText(text: string): boolean {
  // Check if text contains Chinese characters using Unicode ranges
  const chineseRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uF900-\uFAFF\u2F800-\u2FA1F]/;
  return chineseRegex.test(text);
}
