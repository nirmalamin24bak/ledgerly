export type UserRole = 'owner' | 'accountant'

export type BillStatus = 'pending' | 'paid' | 'partial'

export type PaymentMode = 'cash' | 'cheque' | 'neft' | 'rtgs' | 'upi' | 'other'

export type LedgerEntryType = 'debit' | 'credit'

export type LedgerReferenceType = 'bill' | 'payment'

export type SupplierCategory =
  | 'steel'
  | 'rmc'
  | 'labour'
  | 'cement'
  | 'sand'
  | 'electrical'
  | 'plumbing'
  | 'tiles'
  | 'glass'
  | 'hardware'
  | 'paint'
  | 'other'

export interface UserProfile {
  id: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  owner_id: string
  name: string
  gst_number: string | null
  category: SupplierCategory | null
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface SupplierWithBalance extends Supplier {
  outstanding_balance: number
  total_billed: number
  total_paid: number
  bills_count: number
}

export interface Bill {
  id: string
  supplier_id: string
  owner_id: string
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  total_amount: number
  gst_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  taxable_amount: number
  tds_applicable: boolean
  tds_rate: number | null
  tds_amount: number
  status: BillStatus
  file_url: string | null
  file_name: string | null
  notes: string | null
  raw_extracted_data: ExtractedBillData | null
  created_at: string
  updated_at: string
}

export interface BillWithSupplier extends Bill {
  supplier: Pick<Supplier, 'id' | 'name' | 'gst_number' | 'category'>
}

export interface Payment {
  id: string
  supplier_id: string
  bill_id: string | null
  owner_id: string
  amount: number
  payment_date: string
  mode: PaymentMode
  reference_number: string | null
  notes: string | null
  created_at: string
}

export interface PaymentWithSupplier extends Payment {
  supplier: Pick<Supplier, 'id' | 'name'>
  bill: Pick<Bill, 'id' | 'invoice_number'> | null
}

export interface LedgerEntry {
  id: string
  supplier_id: string
  owner_id: string
  type: LedgerEntryType
  reference_type: LedgerReferenceType
  reference_id: string
  amount: number
  running_balance: number
  entry_date: string
  description: string | null
  created_at: string
}

// AI extracted data from bill scan
export interface ExtractedBillData {
  supplier_name: string | null
  gst_number: string | null
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  line_items: LineItem[]
  taxable_amount: number | null
  cgst_amount: number | null
  sgst_amount: number | null
  igst_amount: number | null
  gst_amount: number | null
  total_amount: number | null
  tds_applicable: boolean
  tds_rate: number | null
  tds_amount: number | null
  confidence: 'high' | 'medium' | 'low'
  raw_text?: string
}

export interface LineItem {
  description: string
  quantity: number | null
  unit: string | null
  rate: number | null
  amount: number | null
  gst_rate: number | null
}

// Dashboard stats
export interface DashboardStats {
  total_outstanding: number
  this_month_payable: number
  overdue_amount: number
  total_suppliers: number
  pending_bills_count: number
  overdue_bills_count: number
}

// API response wrapper
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
