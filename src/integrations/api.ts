const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function signup(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAppointments(token: string) {
  const res = await fetch(`${API_URL}/api/appointments`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json();
}

export async function createAppointment(data: any) {
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create appointment');
  return res.json();
}

export async function updateAppointmentStatus(id: number, status: string, token: string) {
  const res = await fetch(`${API_URL}/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update appointment');
  return res.json();
}

export async function deleteAppointment(id: number, token: string) {
  const res = await fetch(`${API_URL}/api/appointments/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete appointment');
  return res.json();
}

export async function submitReview(data: {
  client_name: string;
  client_email?: string;
  rating: number;
  review_text: string;
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

  try {
    const res = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Submit review error:', errorText);
      throw new Error(errorText || 'Failed to submit review');
    }
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Délai d\'attente dépassé. Veuillez réessayer.');
    }
    throw error;
  }
}

export async function getReviews() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

  try {
    const res = await fetch(`${API_URL}/api/reviews`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Délai d\'attente dépassé. Veuillez réessayer.');
    }
    throw error;
  }
}

export async function getReviewsAll(token: string) {
  const res = await fetch(`${API_URL}/api/reviews/all`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch all reviews');
  return res.json();
}

export async function updateReviewStatus(id: string, approved: boolean, token: string) {
  const res = await fetch(`${API_URL}/api/reviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error('Failed to update review status');
  return res.json();
}

export async function deleteReview(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/reviews/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete review');
  return res.json();
}

export async function createOrder(data: any) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function getOrders(token: string) {
  const res = await fetch(`${API_URL}/api/orders`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(id: number, status: string, token: string) {
  const res = await fetch(`${API_URL}/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}
