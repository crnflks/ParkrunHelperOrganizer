// filename: frontend/src/services/api.ts

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/msalConfig';
import { 
  Helper, 
  CreateHelperRequest, 
  UpdateHelperRequest,
  Schedule,
  CreateScheduleRequest,
  SecureDataResponse,
  HealthResponse 
} from '../types/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearStoredToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getStoredToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  private clearStoredToken(): void {
    sessionStorage.removeItem('accessToken');
  }

  setAccessToken(token: string): void {
    sessionStorage.setItem('accessToken', token);
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    const response = await this.api.get('/');
    return response.data;
  }

  // Secure data endpoint
  async getSecureData(): Promise<SecureDataResponse> {
    const response = await this.api.get('/secure-data');
    return response.data;
  }

  // Helpers API
  async getHelpers(): Promise<Helper[]> {
    const response = await this.api.get('/helpers');
    return response.data;
  }

  async getHelper(id: string): Promise<Helper> {
    const response = await this.api.get(`/helpers/${id}`);
    return response.data;
  }

  async createHelper(helper: CreateHelperRequest): Promise<Helper> {
    const response = await this.api.post('/helpers', helper);
    return response.data;
  }

  async updateHelper(id: string, helper: UpdateHelperRequest): Promise<Helper> {
    const response = await this.api.patch(`/helpers/${id}`, helper);
    return response.data;
  }

  async deleteHelper(id: string): Promise<void> {
    await this.api.delete(`/helpers/${id}`);
  }

  async findHelpersByParkrunId(parkrunId: string): Promise<Helper[]> {
    const response = await this.api.get(`/helpers/search/parkrun-id/${parkrunId}`);
    return response.data;
  }

  // Schedules API (placeholders - implement when backend is complete)
  async getSchedules(): Promise<Schedule[]> {
    const response = await this.api.get('/schedules');
    return response.data;
  }

  async getSchedule(weekKey: string): Promise<Schedule> {
    const response = await this.api.get(`/schedules/${weekKey}`);
    return response.data;
  }

  async createSchedule(schedule: CreateScheduleRequest): Promise<Schedule> {
    const response = await this.api.post('/schedules', schedule);
    return response.data;
  }

  async updateSchedule(weekKey: string, schedule: Partial<Schedule>): Promise<Schedule> {
    const response = await this.api.patch(`/schedules/${weekKey}`, schedule);
    return response.data;
  }

  async deleteSchedule(weekKey: string): Promise<void> {
    await this.api.delete(`/schedules/${weekKey}`);
  }
}

export const apiService = new ApiService();