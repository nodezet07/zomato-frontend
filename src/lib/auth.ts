import { apiFetch } from '@/lib/apiFetch';
import { clearTokens, getRefreshToken, setTokens } from '@/lib/storage';
import { registerForPushNotifications, unregisterForPushNotifications } from '@/lib/pushNotifications';
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

export type PostAuthRoute = '/(tabs)' | '/(onboarding)/location';

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
  void registerForPushNotifications();
  return resolvePostAuthRoute();
}

/** Logged-in users: home if they have an address; otherwise location setup only (no welcome carousel). */
export async function resolvePostAuthRoute(): Promise<PostAuthRoute> {
  try {
    const profile = await fetchProfile();
    const addresses = profile?.addresses ?? [];
    if (addresses.length > 0 || profile?.onboardingCompleted) return '/(tabs)';
    return '/(onboarding)/location';
  } catch {
    return '/(onboarding)/location';
  }
}

export async function loginWithEmailPassword(input: { email: string; password: string }) {
  const body = await apiFetch<{ success: true; message: string; data: AuthPayload & { user: AuthUser } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(input) },
  );
  const route = await saveAuthFromResponse(body);
  return { user: body.data!.user!, route };
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
  const route = await saveAuthFromResponse(body);
  return { user: body.data!.user!, route };
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
  await unregisterForPushNotifications();
  await clearTokens();
}
