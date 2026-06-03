import { apiFetch } from '@/lib/apiFetch';
import { clearTokens, getRefreshToken, setTokens } from '@/lib/storage';
import { fetchProfile } from '@/services/profile';

export type AuthUser = {
  _id: string;
  fullName?: string;
  email: string;
  mobile?: string;
  role?: string;
};

type AuthPayload = {
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
};

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: AuthPayload;
};

export type PostAuthRoute = '/(tabs)' | '/(onboarding)/location' | '/(onboarding)';

/** Persist tokens from verify-otp / login / register responses. */
export async function saveAuthFromResponse(body: ApiEnvelope): Promise<PostAuthRoute> {
  const data = body?.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('Login response did not include tokens');
  }
  await setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return resolvePostAuthRoute();
}

/** Send users with saved addresses straight to home; others complete location once. */
export async function resolvePostAuthRoute(): Promise<PostAuthRoute> {
  try {
    const profile = await fetchProfile();
    if (profile.addresses.length > 0) return '/(tabs)';
  } catch {
    // Profile may fail on flaky network; still allow onboarding.
  }
  return '/(onboarding)';
}

export async function loginWithEmailPassword(input: { email: string; password: string }) {
  const body = await apiFetch<{ success: true; message: string; data: AuthPayload & { user: AuthUser } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(input) },
  );
  await saveAuthFromResponse(body);
  return body.data!.user!;
}

export async function registerWithEmailPassword(input: {
  fullName: string;
  email: string;
  password: string;
  mobile?: string;
}) {
  const body = await apiFetch<{ success: true; message: string; data: AuthPayload & { user: AuthUser } }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ ...input, role: 'CUSTOMER' }) },
  );
  await saveAuthFromResponse(body);
  return body.data!.user!;
}

export async function logout() {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }), _retry: true } as any);
    }
  } catch {
    // Still clear local session if backend is unreachable.
  }
  await clearTokens();
}
