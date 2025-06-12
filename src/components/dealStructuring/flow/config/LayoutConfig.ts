
export const LAYOUT_CONFIG = {
  SECTION_WIDTH: 380,
  SECTION_SPACING: 80,
  VERTICAL_SPACING: 140,
  START_Y: 50,
  
  // Section positions
  get BEFORE_X() { return 50; },
  get TRANSACTION_X() { return this.BEFORE_X + this.SECTION_WIDTH + this.SECTION_SPACING; },
  get AFTER_X() { return this.TRANSACTION_X + this.SECTION_WIDTH + this.SECTION_SPACING; }
};
