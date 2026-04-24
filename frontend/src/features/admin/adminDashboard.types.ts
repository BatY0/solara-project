import type { Field } from "../fields/types";
import type { EspDeviceResponse } from "../devices/deviceTypes";

export type UserRole = "ADMIN" | "USER";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    status?: number;
    error?: string;
    timestamp: string;
}

export interface AdminUser {
    id: string;
    name: string;
    surname: string;
    email: string;
    role: UserRole;
    preferredLanguage: string;
    createdAt: string;
}

export interface UserDetail {
    user: AdminUser;
    deviceCount: number;
    fieldCount: number;
    analysisCount: number;
    sensorLogsCount: number;
}

export interface SortInfo {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
}

export interface PageableInfo {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
    sort: SortInfo;
}

export interface PagedResponse<T> {
    content: T[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
    empty: boolean;
    sort: SortInfo;
    pageable: PageableInfo;
}

export interface UserDashboardResponse {
    users: PagedResponse<UserDetail>;
    totalUsers: number;
}

export interface DashboardStats {
    totalUsers: number;
    totalFields: number;
    totalDevices: number;
    totalAnalysisLogs: number;
    totalSensorLogs: number;
}

export interface FieldWithDevice {
    field: Field;
    device: EspDeviceResponse | null;
}

export interface UserDetailsResponse {
    user: AdminUser;
    fields: FieldWithDevice[];
    totalFields: number;
    totalDevices: number;
    totalSensorLogs: number;
    totalAnalysisLogs: number;
}
