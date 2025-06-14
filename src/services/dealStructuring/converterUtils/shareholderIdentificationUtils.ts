
// Helper functions for identifying different types of shareholders from analysis results

// --- Constants for consolidating Target Shareholder entities ---
export const NORMALIZED_TARGET_SHAREHOLDER_NAME = 'Former Target Shareholders';

// --- Helper functions for identifying shareholder types from analysis results ---

// Identifies shareholders who are explicitly marked as "continuing" or "remaining" in the target company.
export const isContinuingOrRemainingShareholder = (name: string) =>
    name.toLowerCase().includes('continuing') || name.toLowerCase().includes('remaining');

// A broader check to identify any group referred to as "Target Shareholders".
export const isTargetShareholderGroup = (name: string) =>
    /target shareholder/i.test(name);
