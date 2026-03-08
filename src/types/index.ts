export type PaymentMode = 'HostPays' | 'DirectToRestaurant';
export type SessionStatus = 'Draft' | 'ItemsReviewed' | 'PeopleAdded' | 'ItemsAssigned' | 'Finalized';
export type AllocationType = 'Full' | 'EqualShare' | 'QuantityShare' | 'CustomAmount';
export type AdjustmentAllocation = 'Equal' | 'Proportional' | 'AssignedToOne';

export interface SessionSummary {
  id: string;
  name: string;
  currency: string;
  paymentMode: PaymentMode;
  status: SessionStatus;
  subtotal: number;
  vat: number;
  tip: number;
  serviceFee: number;
  discount: number;
  total: number;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Allocation {
  id: string;
  personId: string;
  personName: string;
  allocationType: AllocationType;
  amount: number;
  quantityPortion: number;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
  isManuallyAdded: boolean;
  allocations: Allocation[];
}

export interface SessionDetail extends SessionSummary {
  tipAllocation: AdjustmentAllocation;
  serviceFeeAllocation: AdjustmentAllocation;
  discountAllocation: AdjustmentAllocation;
  people: Person[];
  items: ReceiptItem[];
}

export interface PersonTotal {
  personId: string;
  personName: string;
  itemsSubtotal: number;
  adjustmentsShare: number;
  total: number;
  isHost: boolean;
}

export interface BillSummary {
  subtotal: number;
  vat: number;
  tip: number;
  serviceFee: number;
  discount: number;
  total: number;
  personTotals: PersonTotal[];
}

export interface OcrResult {
  rawText: string;
  parsedItems: ParsedItem[];
  parsedSubtotal: number | null;
  parsedVat: number | null;
  parsedTotal: number | null;
  parseSuccess: boolean;
}

export interface ParsedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
