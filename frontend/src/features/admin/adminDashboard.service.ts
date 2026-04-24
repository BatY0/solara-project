import type { AxiosResponse } from "axios";
import api from "../../lib/axios";
import type {
    ApiResponse,
    DashboardStats,
    UserDashboardResponse,
    UserDetailsResponse,
    UserRole,
} from "./adminDashboard.types";

const unwrap = <T>(response: AxiosResponse<ApiResponse<T>>): T => response.data.data;

export const adminDashboardService = {
    async getUsers(page = 0, size = 10): Promise<UserDashboardResponse> {
        const response = await api.get<ApiResponse<UserDashboardResponse>>("/admin/dashboard/list-users", {
            params: { page, size },
        });
        return unwrap(response);
    },

    async getStats(): Promise<DashboardStats> {
        const response = await api.post<ApiResponse<DashboardStats>>("/admin/dashboard/stats");
        return unwrap(response);
    },

    async getUserDetails(userId: string): Promise<UserDetailsResponse> {
        const response = await api.get<ApiResponse<UserDetailsResponse>>(`/admin/dashboard/${userId}/details`);
        return unwrap(response);
    },

    async updateUserRole(userId: string, newRole: UserRole): Promise<string> {
        const response = await api.post<ApiResponse<string>>(
            `/admin/dashboard/${userId}/update-role`,
            JSON.stringify(newRole)
        );
        return unwrap(response);
    },

    async deleteUser(userId: string): Promise<void> {
        await api.delete(`/auth/admin/delete-user/${userId}`);
    },
};
