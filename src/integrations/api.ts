const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001';
  }
  return 'https://brow-bloom-server.vercel.app'; // Remplacez par votre URL de backend réelle
};

export const API_URL = getApiUrl();

async function fetchWithTimeout(url: string, options: any = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  console.log(`🚀 Requesting: ${url}`);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    console.log(`✅ Received from ${url}: ${response.status}`);
    return response;
  } catch (error) {
    clearTimeout(id);
    console.error(`❌ Error/Timeout for ${url}:`, error);
    throw error;
  }
}

export async function login(email: string, password: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

export async function signup(email: string, password: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Signup failed' }));
    throw new Error(err.error || 'Signup failed');
  }
  return res.json();
}

export async function createAppointment(data: any) {
  const res = await fetchWithTimeout(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create appointment');
  return res.json();
}

export async function getAppointments(token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/appointments`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json();
}

export async function updateAppointmentStatus(id: number, status: string, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update appointment status');
  return res.json();
}

export async function deleteAppointment(id: number, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/appointments/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete appointment');
  return res.json();
}

export async function getBookedSlots(date: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/booked-slots?date=${date}`);
  if (!res.ok) throw new Error('Failed to fetch booked slots');
  return res.json();
}

export async function submitReview(data: {
  client_name: string;
  client_email?: string;
  rating: number;
  review_text: string;
}) {
  const res = await fetchWithTimeout(`${API_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Submit review error:', errorText);
    throw new Error(errorText || 'Failed to submit review');
  }
  return res.json();
}

export async function getReviews() {
  const res = await fetchWithTimeout(`${API_URL}/api/reviews`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function getReviewsAll(token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/reviews/all`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch all reviews');
  return res.json();
}

export async function updateReviewStatus(id: string, approved: boolean, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/reviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error('Failed to update review status');
  return res.json();
}

export async function deleteReview(id: string, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/reviews/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete review');
  return res.json();
}

export async function createOrder(data: any) {
  const res = await fetchWithTimeout(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function getOrders(token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/orders`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(id: number, status: string, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

// PRESTATIONS
export async function getPrestations() {
  const res = await fetchWithTimeout(`${API_URL}/api/prestations`);
  if (!res.ok) throw new Error('Failed to fetch prestations');
  return res.json();
}

export async function createPrestation(data: any, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/prestations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create prestation');
  return res.json();
}

export async function updatePrestation(id: number, data: any, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/prestations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update prestation');
  return res.json();
}

export async function deletePrestation(id: number, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/prestations/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete prestation');
  return res.json();
}

// ITEMS PON
export async function getItemsPON() {
  const res = await fetchWithTimeout(`${API_URL}/api/items-pon`);
  if (!res.ok) throw new Error('Failed to fetch PON items');
  return res.json();
}

export async function createItemPON(data: any, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/items-pon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create PON item');
  return res.json();
}

export async function updateItemPON(id: number, data: any, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/items-pon/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update PON item');
  return res.json();
}

export async function deleteItemPON(id: number, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/items-pon/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete PON item');
  return res.json();
}

// GALLERY
export async function getGalleryItems() {
  const res = await fetchWithTimeout(`${API_URL}/api/gallery`);
  if (!res.ok) throw new Error('Failed to fetch gallery items');
  return res.json();
}

export async function createGalleryItem(data: any, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/gallery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create gallery item');
  return res.json();
}

export async function deleteGalleryItem(id: number, token: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/gallery/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete gallery item');
  return res.json();
}
