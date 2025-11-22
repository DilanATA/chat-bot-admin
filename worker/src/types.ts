export type TenantSettings = {
  tenant: string;
  sheet_id: string;
  sheet_name: string;
  date_col: number;
  phone_col: number;
  plate_col: number;
  status_col: number;
};

export type SheetRow = {
  rowIndex: number; // 0-based
  plate: string;
  phone: string;
  dateRaw: string;
  status: string;
  name?: string;    // <-- eklendi
};

