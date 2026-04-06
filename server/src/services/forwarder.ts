import axios from 'axios';
import { AuthType } from '../models/Trapper';

export interface ForwardResult {
  success: boolean;
  responseCode: number | null;
  latency: number | null;
  errorMessage: string | null;
}

function buildAuthHeaders(authType: AuthType, authValue: string | null): Record<string, string> {
  if (!authValue) return {};

  switch (authType) {
    case 'bearer':
      return { Authorization: `Bearer ${authValue}` };
    case 'basic':
      return { Authorization: `Basic ${Buffer.from(authValue).toString('base64')}` };
    case 'hmac':
      return { 'X-Signature': authValue };
    default:
      return {};
  }
}

export async function send(
  destinationUrl: string,
  payload: unknown,
  authType: AuthType,
  authValue: string | null
): Promise<ForwardResult> {
  const authHeaders = buildAuthHeaders(authType, authValue);

  try {
    const start = Date.now();
    const response = await axios.post(destinationUrl, payload, {
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      timeout: 10000,
      validateStatus: () => true,
    });
    const latency = Date.now() - start;
    const responseCode = response.status;

    if (responseCode >= 200 && responseCode < 300) {
      return { success: true, responseCode, latency, errorMessage: null };
    }
    return { success: false, responseCode, latency, errorMessage: `Destination returned HTTP ${responseCode}` };
  } catch (err) {
    return {
      success: false,
      responseCode: null,
      latency: null,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
