const baseUrl = import.meta.env.VITE_STRIPE_SERVER_URL || 'http://localhost:4242';

const handleResponse = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: 'No se pudo interpretar la respuesta del servidor de pagos.' };
  }

  if (!response.ok) {
    return { success: false, error: payload?.error || 'Error al comunicarse con el servidor de pagos.' };
  }

  return payload;
};

const createCheckoutSession = async (payload) => {
  const response = await fetch(`${baseUrl}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

const retrieveCheckoutSession = async (sessionId) => {
  const url = new URL(`${baseUrl}/checkout-session`);
  url.searchParams.set('session_id', sessionId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(response);
};

const StripeService = {
  createCheckoutSession,
  retrieveCheckoutSession,
};

export default StripeService;
