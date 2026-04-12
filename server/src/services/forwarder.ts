import axios from 'axios';
import https from 'https';
import { AuthType } from '../models/Trapper';

const agentNoVerify = new https.Agent({ rejectUnauthorized: false });

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
    case 'custom':
      return { Authorization: authValue };
    default:
      return {};
  }
}

export async function send(
  destinationUrl: string,
  payload: unknown,
  authType: AuthType,
  authValue: string | null,
  skipTlsVerify = false
): Promise<ForwardResult> {
  const authHeaders = buildAuthHeaders(authType, authValue);

  try {
    const start = Date.now();
    const response = await axios.post(destinationUrl, payload, {
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      timeout: 10000,
      validateStatus: () => true,
      ...(skipTlsVerify ? { httpsAgent: agentNoVerify } : {}),
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
