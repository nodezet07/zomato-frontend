import { apiFetch } from '@/lib/apiFetch';

export type PaymentOrderResponse = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string | null;
  razorpayOrderId: string | null;
  razorpayAmount: number;
  autoConfirmed?: boolean;
  order?: { _id: string; orderStatus?: string };
};

export async function createPaymentOrder(orderId: string): Promise<PaymentOrderResponse> {
  const body = await apiFetch('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
  return (body as any)?.data ?? (body as any);
}

export async function verifyPayment(input: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const body = await apiFetch('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return (body as any)?.data ?? (body as any);
}

/** Development-only: confirm ONLINE order without Razorpay SDK */
export async function devConfirmPayment(orderId: string) {
  const body = await apiFetch('/payments/dev-confirm', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
  return (body as any)?.data ?? (body as any);
}
