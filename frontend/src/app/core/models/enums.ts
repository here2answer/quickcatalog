export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum GstRate {
  GST_0 = 'GST_0',
  GST_5 = 'GST_5',
  GST_12 = 'GST_12',
  GST_18 = 'GST_18',
  GST_28 = 'GST_28',
}

export const GST_RATE_VALUES: Record<GstRate, number> = {
  [GstRate.GST_0]: 0,
  [GstRate.GST_5]: 5,
  [GstRate.GST_12]: 12,
  [GstRate.GST_18]: 18,
  [GstRate.GST_28]: 28,
};

export enum UnitType {
  PCS = 'PCS', KG = 'KG', GM = 'GM', LTR = 'LTR', ML = 'ML',
  MTR = 'MTR', CM = 'CM', BOX = 'BOX', SET = 'SET', PAIR = 'PAIR',
  DOZEN = 'DOZEN', PACK = 'PACK', ROLL = 'ROLL', SQ_FT = 'SQ_FT', SQ_MTR = 'SQ_MTR',
}

export enum BarcodeType {
  EAN13 = 'EAN13', UPC = 'UPC', CUSTOM = 'CUSTOM', NONE = 'NONE',
}
