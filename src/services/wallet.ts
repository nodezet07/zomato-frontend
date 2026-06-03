import { apiFetch } from '@/lib/apiFetch';

export async function fetchWallet() {
  const body = await apiFetch('/users/wallet');
  return (body as any)?.data?.wallet ?? (body as any)?.data;
}

export async function fetchWalletTransactions(page = 1, limit = 20) {
  const qs = `?${new URLSearchParams({ page: String(page), limit: String(limit) })}`;
  const body = await apiFetch(`/users/wallet/transactions${qs}`);
  return (body as any)?.data?.transactions ?? (body as any)?.data ?? [];
}
