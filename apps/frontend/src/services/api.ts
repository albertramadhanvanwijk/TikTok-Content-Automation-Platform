import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';
import { API_BASE_URL, API_TIMEOUT, JWT_COOKIE_NAME } from '@/utils/constants';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getTokenFromCookie();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<any>) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          this.isRefreshing = true;
          originalRequest._retry = true;

          try {
            // Attempt to refresh token via backend
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );

            const newToken = response.data?.data?.tokens?.accessToken;
            if (newToken) {
              this.setTokenInCookie(newToken);
              this.isRefreshing = false;
              
              this.refreshSubscribers.forEach(cb => cb(newToken));
              this.refreshSubscribers = [];

              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, redirect to login
            this.clearTokenFromCookie();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            this.isRefreshing = false;
            this.refreshSubscribers = [];
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === JWT_COOKIE_NAME) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private setTokenInCookie(token: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${JWT_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=604800; secure; samesite=strict`;
  }

  private clearTokenFromCookie(): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${JWT_COOKIE_NAME}=; path=/; max-age=0`;
  }

  public async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  public getHttpClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
