import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trapper_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('trapper_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export interface Trapper {
  id: string;
  name: string;
  description: string | null;
  trapId: string;
  status: 'active' | 'paused';
  destinationUrl: string;
  retryPolicy: 'exponential' | 'immediate' | 'none';
  authType: 'bearer' | 'basic' | 'hmac' | 'none' | 'custom';
  authValue: string | null;
  rateLimit: number | null;
  rateLimitWindowMs: number | null;
  hmacConfigured: boolean;
  hmacHeader: string | null;
  hmacAlgorithm: 'sha256' | 'sha1';
  overrideEnabled: boolean;
  overridePayload: string | null;
  skipTlsVerify: boolean;
  customAuthHeader: string | null;
  deliveryMode: 'broadcast' | 'fallback';
}

export interface FilterRule {
  id: string;
  trapperId: string;
  fieldPath: string;
  operator:
    | 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'matches' | 'is_empty' | 'is_not_empty'
    | 'is_true' | 'is_false'
    | 'gt' | 'lt' | 'gte' | 'lte'
    | 'in' | 'not_in'
    | 'has_key' | 'has_keys' | 'is_null' | 'is_not_null'
    | 'exists' | 'not_exists';
  value: string | null;
  order: number;
  logicOp: 'AND' | 'OR';
  groupBefore: number;
  groupAfter: number;
}

export interface WebhookLog {
  id: string;
  trapperId: string;
  timestamp: string;
  sourceIp: string;
  method: string;
  headers: string;
  payload: string;
  status: 'SENT' | 'FILTERED' | 'REJECTED' | 'QUEUED';
  responseCode: number | null;
  latency: number | null;
  errorMessage: string | null;
  parentLogId: string | null;
  destinationId: string | null;
  destinationLabel: string | null;
}

export interface Destination {
  id: string;
  trapperId: string;
  label: string;
  url: string;
  authType: 'bearer' | 'basic' | 'hmac' | 'none' | 'custom';
  authValue: string | null;
  customAuthHeader: string | null;
  skipTlsVerify: boolean;
  retryPolicy: 'exponential' | 'immediate' | 'none';
  createdAt: string;
}

export interface LogsResponse {
  total: number;
  page: number;
  limit: number;
  rows: WebhookLog[];
}

export interface Stats {
  totalToday: number;
  sent: number;
  filtered: number;
  avgLatency: number | null;
  activeTrappers: number;
  hourly: { hour: number; sent: number; filtered: number; rejected: number }[];
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface FailedJob {
  jobId: string;
  data: { trapperId: string; payload: unknown };
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string }>('/auth/login', { username, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get<{ username: string }>('/auth/me').then((r) => r.data),
};

export const trappersApi = {
  list: () => api.get<Trapper[]>('/trappers').then((r) => r.data),
  create: (data: Partial<Trapper>) => api.post<Trapper>('/trappers', data).then((r) => r.data),
  get: (id: string) => api.get<Trapper>(`/trappers/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<Trapper>) => api.put<Trapper>(`/trappers/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/trappers/${id}`),
  setStatus: (id: string, status: 'active' | 'paused') =>
    api.patch<Trapper>(`/trappers/${id}/status`, { status }).then((r) => r.data),
  getRules: (id: string) => api.get<FilterRule[]>(`/trappers/${id}/rules`).then((r) => r.data),
  setRules: (id: string, rules: Partial<FilterRule>[]) =>
    api.put<FilterRule[]>(`/trappers/${id}/rules`, rules).then((r) => r.data),
  testRules: (id: string, rules: Partial<FilterRule>[], payload: unknown) =>
    api.post(`/trappers/${id}/test`, { rules, payload }).then((r) => r.data),
  getLogs: (id: string, params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<LogsResponse>(`/trappers/${id}/logs`, { params }).then((r) => r.data),
};

export const destinationsApi = {
  list: (trapperId: string) =>
    api.get<Destination[]>(`/trappers/${trapperId}/destinations`).then((r) => r.data),
  create: (trapperId: string, data: Partial<Destination>) =>
    api.post<Destination>(`/trappers/${trapperId}/destinations`, data).then((r) => r.data),
  update: (trapperId: string, destId: string, data: Partial<Destination>) =>
    api.put<Destination>(`/trappers/${trapperId}/destinations/${destId}`, data).then((r) => r.data),
  delete: (trapperId: string, destId: string) =>
    api.delete(`/trappers/${trapperId}/destinations/${destId}`),
};

export const statsApi = {
  get: () => api.get<Stats>('/stats').then((r) => r.data),
};

export const logsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<LogsResponse>('/logs', { params }).then((r) => r.data),
};

export const queueApi = {
  getStats: () => api.get<QueueStats>('/queue/stats').then((r) => r.data),
  getFailed: () => api.get<FailedJob[]>('/queue/failed').then((r) => r.data),
  retryJob: (jobId: string) => api.post(`/queue/retry/${jobId}`).then((r) => r.data),
};

export default api;
