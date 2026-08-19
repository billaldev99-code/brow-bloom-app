const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return window.location.origin; // dev : même origine (proxy Vite → http://127.0.0.1:3001)
  }
  return 'https://brow-bloom-api.vercel.app'; // URL du backend déployé
};

export const API_URL = getApiUrl();
const TOKEN_KEY = 'bb_token';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export const setToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

async function fetchWithTimeout(url: string, options: any = {}, timeout = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const headers: Record<string, string> = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  console.log(`🚀 Requesting: ${url}`);
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
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
  const data = await res.json();
  if (data.token) setToken(data.token);
  return data;
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
  const data = await res.json();
  if (data.token) setToken(data.token);
  return data;
}

export async function logout() {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/auth/logout`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Logout failed');
    return await res.json();
  } finally {
    setToken(null);
  }
}

export async function getMe() {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/me`);
  if (!res.ok) throw new Error('Not authenticated');
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

export async function getAppointments() {
  const res = await fetchWithTimeout(`${API_URL}/api/appointments`);
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json();
}

export async function updateAppointmentStatus(id: number, status: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update appointment status');
  return res.json();
}

export async function deleteAppointment(id: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/appointments/${id}`, {
    method: 'DELETE',
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

export async function getReviewsAll() {
  const res = await fetchWithTimeout(`${API_URL}/api/reviews/all`);
  if (!res.ok) throw new Error('Failed to fetch all reviews');
  return res.json();
}

export async function updateReviewStatus(id: string, approved: boolean) {
  const res = await fetchWithTimeout(`${API_URL}/api/reviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error('Failed to update review status');
  return res.json();
}

export async function deleteReview(id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/reviews/${id}`, {
    method: 'DELETE',
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

export async function getOrders() {
  const res = await fetchWithTimeout(`${API_URL}/api/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(id: number, status: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

// PRESTATIONS
export async function deleteOrder(id: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/orders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete order');
  return res.json();
}

export async function getPrestations() {
  const res = await fetchWithTimeout(`${API_URL}/api/prestations`);
  if (!res.ok) throw new Error('Failed to fetch prestations');
  return res.json();
}

export async function createPrestation(data: any) {
  const res = await fetchWithTimeout(`${API_URL}/api/prestations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create prestation');
  return res.json();
}

export async function updatePrestation(id: number, data: any) {
  const res = await fetchWithTimeout(`${API_URL}/api/prestations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update prestation');
  return res.json();
}

export async function deletePrestation(id: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/prestations/${id}`, {
    method: 'DELETE',
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

export async function createItemPON(data: any) {
  const res = await fetchWithTimeout(`${API_URL}/api/items-pon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create PON item');
  return res.json();
}

export async function updateItemPON(id: number, data: any) {
  const res = await fetchWithTimeout(`${API_URL}/api/items-pon/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update PON item');
  return res.json();
}

export async function deleteItemPON(id: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/items-pon/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete PON item');
  return res.json();
}

// GALLERY
export async function getGalleryItems() {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/gallery`, {}, 15000);
    if (!res.ok) throw new Error('Failed to fetch gallery items');
    return res.json();
  } catch (err) {
    console.error('Gallery fetch failed:', err);
    throw err;
  }
}

export async function createGalleryItem(data: any) {
  const res = await fetchWithTimeout(`${API_URL}/api/gallery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create gallery item');
  return res.json();
}

export async function deleteGalleryItem(id: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/gallery/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete gallery item');
  return res.json();
}

// FORMATIONS
export async function createFormation(data: {
  types: string[];
  client_name: string;
  client_phone: string;
  client_email: string;
}) {
  const res = await fetchWithTimeout(`${API_URL}/api/formations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Submit formation error:', errorText);
    throw new Error(errorText || 'Failed to submit formation request');
  }
  return res.json();
}

export async function getFormations() {
  const res = await fetchWithTimeout(`${API_URL}/api/formations`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to fetch formations (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function updateFormationStatus(id: number, status: string, adminMessage: string | null) {
  const res = await fetchWithTimeout(`${API_URL}/api/formations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, admin_message: adminMessage }),
  });
  if (!res.ok) throw new Error('Failed to update formation status');
  return res.json();
}

export async function deleteFormation(id: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/formations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete formation');
  return res.json();
}

// CLIENT PHOTOS (Vos retours en images)
export interface ClientPhoto {
  id: number;
  first_name: string;
  last_name: string;
  prestation_type: string;
  message: string | null;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export async function submitClientPhoto(data: {
  first_name: string;
  last_name: string;
  prestation_type: string;
  message?: string;
  photos: string[];
}) {
  const res = await fetchWithTimeout(`${API_URL}/api/client-photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Erreur (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getApprovedClientPhotos() {
  const res = await fetchWithTimeout(`${API_URL}/api/client-photos/approved`);
  if (!res.ok) throw new Error('Failed to fetch approved photos');
  return res.json() as Promise<ClientPhoto[]>;
}

export async function getAllClientPhotos() {
  const res = await fetchWithTimeout(`${API_URL}/api/client-photos`);
  if (!res.ok) throw new Error('Failed to fetch client photos');
  return res.json() as Promise<ClientPhoto[]>;
}

export async function updateClientPhoto(id: number, data: { status?: string; message?: string | null }) {
  const res = await fetchWithTimeout(`${API_URL}/api/client-photos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update client photo');
  return res.json();
}

export async function deleteClientPhoto(id: number) {
  const res = await fetchWithTimeout(`${API_URL}/api/client-photos/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete client photo');
  return res.json();
}
