import { apiClient } from '../client';

export const planQuotaByKey = {
  free: { total: 10000, label: '每月 1 万字额度' },
  essential: { total: 150000, label: '每月 15 万字额度' },
  premium: { total: 300000, label: '每月 30 万字额度' },
  professional: { total: 500000, label: '每月 50 万字额度' },
  team: { total: 1000000, label: '团队 100 万字起步额度' },
};

export const createOrder = async ({ planKey, planCode, billingCycle, paymentMethod }: {
  planKey: string;
  planCode: string;
  billingCycle: string;
  paymentMethod: string;
}) => {
  const payload = {
    planKey,
    planCode,
    billingCycle,
    paymentMethod,
    createdAt: new Date().toISOString(),
  };

  return apiClient.post('/api/orders', payload);
};

export const payOrder = async (orderId: string, { paymentMethod }: { paymentMethod?: string } = {}) => {
  const payload = { orderId, paymentMethod };
  return apiClient.post(`/api/orders/${orderId}/pay`, payload);
};

export const fetchSubscriptionSnapshot = async (planKey?: string, planCode?: string) =>
  apiClient.get(`/api/subscriptions/preview?plan=${encodeURIComponent(planKey || '')}`);
