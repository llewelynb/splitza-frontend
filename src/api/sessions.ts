import { api } from './client';
import type {
  SessionSummary, SessionDetail, Person, ReceiptItem,
  BillSummary, OcrResult, ParsedItem, PaymentMode,
  AdjustmentAllocation, AllocationType,
} from '../types';

// Sessions
export const getSessions = () => api.get<SessionSummary[]>('/sessions');
export const getSession = (id: string) => api.get<SessionDetail>(`/sessions/${id}`);
export const createSession = (name: string, paymentMode: PaymentMode, hostName: string) =>
  api.post<SessionSummary>('/sessions', { name, paymentMode, hostName });
export const updateSession = (id: string, data: Partial<{
  name: string;
  paymentMode: PaymentMode;
  tip: number;
  serviceFee: number;
  discount: number;
  tipAllocation: AdjustmentAllocation;
  serviceFeeAllocation: AdjustmentAllocation;
  discountAllocation: AdjustmentAllocation;
}>) => api.patch<SessionDetail>(`/sessions/${id}`, data);
export const deleteSession = (id: string) => api.delete<void>(`/sessions/${id}`);

export const finalizeSession = (id: string, data: {
  paymentMode: PaymentMode;
  tip: number;
  serviceFee: number;
  discount: number;
  tipAllocation: AdjustmentAllocation;
  serviceFeeAllocation: AdjustmentAllocation;
  discountAllocation: AdjustmentAllocation;
  tipAssignedToPersonId?: string;
  serviceFeeAssignedToPersonId?: string;
  discountAssignedToPersonId?: string;
}) => api.post<BillSummary>(`/sessions/${id}/finalize`, data);

// People
export const addPerson = (sessionId: string, name: string, isHost = false) =>
  api.post<Person>(`/sessions/${sessionId}/people`, { name, isHost });
export const removePerson = (sessionId: string, personId: string) =>
  api.delete<void>(`/sessions/${sessionId}/people/${personId}`);

// Items
export const addItem = (sessionId: string, item: {
  name: string; quantity: number; unitPrice: number; isManuallyAdded?: boolean;
}) => api.post<ReceiptItem>(`/sessions/${sessionId}/items`, item);
export const updateItem = (sessionId: string, itemId: string, data: {
  name?: string; quantity?: number; unitPrice?: number;
}) => api.patch<ReceiptItem>(`/sessions/${sessionId}/items/${itemId}`, data);
export const deleteItem = (sessionId: string, itemId: string) =>
  api.delete<void>(`/sessions/${sessionId}/items/${itemId}`);
export const setAllocations = (sessionId: string, itemId: string, allocations: {
  personId: string;
  allocationType: AllocationType;
  customAmount?: number;
  quantityPortion?: number;
}[]) => api.put<ReceiptItem>(`/sessions/${sessionId}/items/${itemId}/allocations`, { allocations });

// OCR
export const scanReceipt = (imageBase64: string, mimeType = 'image/jpeg') =>
  api.post<OcrResult>('/ocr/scan', { imageBase64, mimeType });
export const importOcrItems = (sessionId: string, items: ParsedItem[]) =>
  api.post<SessionDetail>(`/ocr/import/${sessionId}`, items);
