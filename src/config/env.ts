/**
 * Environment Configuration (HerRidez-style)
 *
 * Development:
 * - EXPO_PUBLIC_API_URL / EXPO_PUBLIC_SOCKET_URL override everything when set.
 * - Otherwise we derive the API host from Metro (expo-constants) so it matches
 *   the machine running the bundler — avoids wrong hardcoded IPs.
 * - Android emulator fallback: 10.0.2.2 (host machine loopback).
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isProduction = !__DEV__;

// TODO: replace with your real production domain when you deploy
const PRODUCTION_API_URL = 'https://example.com/api/v1';
const PRODUCTION_SOCKET_URL = 'https://example.com';

// Your backend runs on 5000 locally
const DEFAULT_BACKEND_PORT = 5000;
const FALLBACK_LAN_HOST = '192.168.1.100';

/** Host where Metro runs (same PC as API in typical dev). */
function resolveDevHostFromExpo(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0]?.trim();
    if (
      host &&
      !host.endsWith('.exp.direct') &&
      !host.includes('ngrok') &&
      host !== 'localhost' &&
      host !== '127.0.0.1'
    ) {
      return host;
    }
  }

  const legacy = (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (legacy && typeof legacy === 'string') {
    const host = legacy.split(':')[0]?.trim();
    if (
      host &&
      !host.endsWith('.exp.direct') &&
      !host.includes('ngrok') &&
      host !== 'localhost' &&
      host !== '127.0.0.1'
    ) {
      return host;
    }
  }

  return null;
}

function getDevApiUrl(): string {
  const host = resolveDevHostFromExpo();
  if (Platform.OS === 'android') {
    if (host) return `http://${host}:${DEFAULT_BACKEND_PORT}/api/v1`;
    return `http://${FALLBACK_LAN_HOST}:${DEFAULT_BACKEND_PORT}/api/v1`;
  }
  if (host) return `http://${host}:${DEFAULT_BACKEND_PORT}/api/v1`;
  return `http://${FALLBACK_LAN_HOST}:${DEFAULT_BACKEND_PORT}/api/v1`;
}

function getDevSocketUrl(): string {
  const host = resolveDevHostFromExpo();
  if (Platform.OS === 'android') {
    if (host) return `http://${host}:${DEFAULT_BACKEND_PORT}`;
    return `http://${FALLBACK_LAN_HOST}:${DEFAULT_BACKEND_PORT}`;
  }
  if (host) return `http://${host}:${DEFAULT_BACKEND_PORT}`;
  return `http://${FALLBACK_LAN_HOST}:${DEFAULT_BACKEND_PORT}`;
}

export const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  return isProduction ? PRODUCTION_API_URL : getDevApiUrl();
};

export const getSocketUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (envUrl) return envUrl;
  return isProduction ? PRODUCTION_SOCKET_URL : getDevSocketUrl();
};

export const API_URL = getApiUrl();
export const SOCKET_URL = getSocketUrl();

export const ENV_INFO = {
  isProduction,
  isDevelopment: __DEV__,
  platform: Platform.OS,
  apiUrl: API_URL,
  socketUrl: SOCKET_URL,
};

export default {
  API_URL,
  SOCKET_URL,
  getApiUrl,
  getSocketUrl,
  ENV_INFO,
};

