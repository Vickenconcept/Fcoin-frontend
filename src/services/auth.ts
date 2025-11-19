import { apiClient, type ApiResponse } from '@/lib/apiClient';

export type AuthUser = {
  id: string;
  username: string;
  display_name?: string | null;
  email: string;
  avatar_url?: string | null;
  verified_creator: boolean;
  default_coin_symbol: string;
  token_capabilities?: string[];
  user_type?: string;
  profile_bio?: string | null;
  profile_location?: string | null;
  profile_links?: Array<{ label: string; url: string }> | null;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

export async function registerUser(
  input: {
    username: string;
    display_name?: string;
    email: string;
    password: string;
    avatar_url?: string;
  },
): Promise<ApiResponse<AuthPayload>> {
  const response = await apiClient.request<AuthPayload>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuth: true,
  });

  if (response.ok && response.data?.token) {
    apiClient.setToken(response.data.token);
  }

  return response;
}

export async function loginUser(
  input: { email: string; password: string },
): Promise<ApiResponse<AuthPayload>> {
  const response = await apiClient.request<AuthPayload>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuth: true,
  });

  if (response.ok && response.data?.token) {
    apiClient.setToken(response.data.token);
  }

  return response;
}

export async function fetchCurrentUser(): Promise<ApiResponse<AuthUser>> {
  return apiClient.request<AuthUser>('/v1/auth/me');
}

export async function logoutUser(): Promise<ApiResponse<null>> {
  const response = await apiClient.request<null>('/v1/auth/logout', {
    method: 'POST',
  });

  apiClient.setToken(null);

  return response;
}
