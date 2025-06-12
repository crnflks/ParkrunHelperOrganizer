// filename: frontend/src/types/api.ts

export interface Helper {
  id: string;
  name: string;
  parkrunId: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateHelperRequest {
  name: string;
  parkrunId: string;
  email?: string;
  phone?: string;
}

export interface UpdateHelperRequest extends Partial<CreateHelperRequest> {}

export interface VolunteerAssignment {
  helperId: string;
  helperName: string;
  helperParkrunId: string;
  assignedAt: string;
}

export interface Schedule {
  weekKey: string;
  eventDate: string;
  assignments: Record<string, VolunteerAssignment>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy?: string;
}

export interface CreateScheduleRequest {
  weekKey: string;
  eventDate: string;
  assignments?: Record<string, VolunteerAssignment>;
}

export interface SecureDataResponse {
  message: string;
  timestamp: string;
  data: {
    totalVolunteers: number;
    upcomingEvents: number;
    lastUpdated: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}