const API_BASE = '/api/v1';

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = params
      ? `${path}?${new URLSearchParams(params).toString()}`
      : path;
    return this.request<T>(url);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ data: { user: any; providerProfile?: any } }>('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; locale?: string }) =>
    api.post<{ data: { user: any } }>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ data: { user: any; providerProfile?: any } }>('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ data: { message: string } }>('/auth/change-password', { currentPassword, newPassword }),
  verifyEmail: (token: string) =>
    api.post<{ data: { message: string } }>('/auth/verify-email', { token }),
  resendVerification: () =>
    api.post<{ data: { message: string } }>('/auth/verify-email/resend'),
};

// Users
export const usersApi = {
  updateMe: (data: { firstName?: string; lastName?: string; displayName?: string; phone?: string; locale?: string; avatarUrl?: string }) =>
    api.put<{ data: any }>('/users/me', data),
};

// Media
export const mediaApi = {
  upload: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.upload<{ data: any }>('/media/upload', formData);
  },
};

// Providers
export const providersApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/providers', params),
  get: (id: string) =>
    api.get<{ data: any }>(`/providers/${id}`),
  create: (data: any) =>
    api.post<{ data: any }>('/providers', data),
  update: (id: string, data: any) =>
    api.put<{ data: any }>(`/providers/${id}`, data),
  submitApplication: (data: any) =>
    api.post<{ data: any }>('/providers/applications', data),
  getMyApplication: () =>
    api.get<{ data: any }>('/providers/applications/me'),
  getListings: (providerId: string) =>
    api.get<{ data: any[] }>(`/providers/${providerId}/listings`),
  createListing: (providerId: string, data: any) =>
    api.post<{ data: any }>(`/providers/${providerId}/listings`, data),
  updateListing: (providerId: string, listingId: string, data: any) =>
    api.put<{ data: any }>(`/providers/${providerId}/listings/${listingId}`, data),
  getListing: (providerId: string, listingId: string) =>
    api.get<{ data: any }>(`/providers/${providerId}/listings/${listingId}`),
  deleteListing: (providerId: string, listingId: string) =>
    api.delete<{ data: any }>(`/providers/${providerId}/listings/${listingId}`),
  getAvailability: (providerId: string) =>
    api.get<{ data: any[] }>(`/providers/${providerId}/availability`),
  updateAvailability: (providerId: string, rules: any[]) =>
    api.put<{ data: any }>(`/providers/${providerId}/availability`, { rules }),
  getReviews: (providerId: string, params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>(`/providers/${providerId}/reviews`, params),
  createReview: (providerId: string, data: { rating: number; title?: string; content?: string; bookingId?: string }) =>
    api.post<{ data: any }>(`/providers/${providerId}/reviews`, data),
};

// Search
export const searchApi = {
  search: (params: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/search', params),
};

// Categories
export const categoriesApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ data: any[] }>('/categories', params),
  get: (id: string) =>
    api.get<{ data: any }>(`/categories/${id}`),
  suggest: (data: { nameEn: string; nameAr: string; description?: string }) =>
    api.post<{ data: any }>('/categories/suggest', data),
};

// Conversations
export const conversationsApi = {
  list: () =>
    api.get<{ data: any[] }>('/conversations'),
  create: (data: { providerId: string; listingId?: string }) =>
    api.post<{ data: any }>('/conversations', data),
  getMessages: (conversationId: string, before?: string) =>
    api.get<{ data: any[] }>(`/conversations/${conversationId}/messages`, before ? { before } : undefined),
  sendMessage: (conversationId: string, content: string) =>
    api.post<{ data: any }>(`/conversations/${conversationId}/messages`, { content }),
  block: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/block`),
};

// Bookings
export const bookingsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/bookings', params),
  get: (id: string) =>
    api.get<{ data: any }>(`/bookings/${id}`),
  create: (data: any) =>
    api.post<{ data: any }>('/bookings', data),
  update: (id: string, data: { state: string; cancellationReason?: string }) =>
    api.put<{ data: any }>(`/bookings/${id}`, data),
};

// Quotes
export const quotesApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/quotes', params),
  create: (data: any) =>
    api.post<{ data: any }>('/quotes', data),
  respond: (id: string, data: { status: string; providerResponse?: string; providerPrice?: number }) =>
    api.put<{ data: any }>(`/quotes/${id}`, data),
};

// Reviews
export const reviewsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/reviews', params),
  create: (data: { providerId: string; bookingId?: string; rating: number; title?: string; content?: string }) =>
    api.post<{ data: any }>('/reviews', data),
  update: (id: string, data: { rating?: number; title?: string; content?: string }) =>
    api.put<{ data: any }>(`/reviews/${id}`, data),
  delete: (id: string) =>
    api.delete(`/reviews/${id}`),
};

// Reports
export const reportsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/reports', params),
  create: (data: { targetType: string; targetId: string; reason: string; description?: string }) =>
    api.post<{ data: any }>('/reports', data),
  update: (id: string, data: { status: string; resolution?: string }) =>
    api.put<{ data: any }>(`/reports/${id}`, data),
};

// Notifications
export const notificationsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/notifications', params),
  markRead: (data: { ids?: string[]; all?: boolean }) =>
    api.put('/notifications', data),
  unreadCount: () =>
    api.get<{ data: { count: number } }>('/notifications/unread-count'),
};

// Saved
export const savedApi = {
  list: () =>
    api.get<{ data: any[] }>('/saved'),
  save: (providerId: string) =>
    api.post<{ data: any }>('/saved', { providerId }),
  unsave: (providerId: string) =>
    api.delete(`/saved/${providerId}`),
};

// Admin
export const adminApi = {
  overview: () =>
    api.get<{ data: any }>('/admin/overview'),
  getUsers: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/admin/users', params),
  updateUser: (data: { userId: string; role?: string; accountState?: string }) =>
    api.put<{ data: any }>('/admin/users', data),
  getProviders: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/admin/providers', params),
  updateProvider: (data: { providerProfileId: string; verificationStatus: string; verificationNotes?: string }) =>
    api.put<{ data: any }>('/admin/providers', data),
  getApplications: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/admin/applications', params),
  reviewApplication: (data: { applicationId: string; status: string; adminNotes?: string }) =>
    api.put<{ data: any }>('/admin/applications', data),
  getCategories: (params?: Record<string, string>) =>
    api.get<{ data: any[] }>('/admin/categories', params),
  updateCategory: (id: string, data: any) =>
    api.put<{ data: any }>(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) =>
    api.delete<{ data: any }>(`/admin/categories/${id}`),
  approveCategory: (id: string) =>
    api.post<{ data: any }>(`/admin/categories/approve/${id}`),
  getReports: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/admin/reports', params),
  resolveReport: (data: { reportId: string; status: string; resolution?: string }) =>
    api.put<{ data: any }>('/admin/reports', data),
  getAuditLog: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/admin/audit', params),
  getBookings: (params?: Record<string, string>) =>
    api.get<{ data: any[]; pagination: any }>('/admin/bookings', params),
};
