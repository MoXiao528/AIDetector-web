const planQuotaByKey = {
  free: { total: 10000, label: '每月 1 万字额度' },
  essential: { total: 150000, label: '每月 15 万字额度' },
  premium: { total: 300000, label: '每月 30 万字额度' },
  professional: { total: 500000, label: '每月 50 万字额度' },
  team: { total: 1000000, label: '团队 100 万字起步额度' },
};

const safeRequest = async (url, options, fallback) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (typeof fallback === 'function') {
      return fallback(error);
    }
    throw error;
  }
};

export const createOrder = async ({ planKey, planCode, billingCycle, paymentMethod }) => {
  const payload = {
    planKey,
    planCode,
    billingCycle,
    paymentMethod,
    createdAt: new Date().toISOString(),
  };

  return safeRequest(
    '/api/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => ({
      id: `mock-order-${Date.now()}`,
      status: 'pending',
      ...payload,
    }),
  );
};

export const payOrder = async (orderId, { paymentMethod } = {}) => {
  const payload = { orderId, paymentMethod };
  return safeRequest(
    `/api/orders/${orderId}/pay`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => {
      const random = Math.random();
      if (random < 0.15) {
        return { orderId, status: 'failed', message: '支付未通过，请稍后重试。' };
      }
      if (random < 0.3) {
        return { orderId, status: 'canceled', message: '用户已取消支付。' };
      }
      return { orderId, status: 'succeeded', paidAt: new Date().toISOString() };
    },
  );
};

export const fetchSubscriptionSnapshot = async (planKey, planCode) => {
  const quota = planQuotaByKey[planKey] || planQuotaByKey.free;
  const normalizedPlan = planCode || `personal-${planKey || 'free'}`;
  const fallback = () => ({
    plan: normalizedPlan,
    credits: {
      total: quota.total,
      remaining: quota.total,
    },
  });

  return safeRequest(
    `/api/subscriptions/preview?plan=${planKey}`,
    {
      method: 'GET',
    },
    fallback,
  );
};

export { planQuotaByKey };
