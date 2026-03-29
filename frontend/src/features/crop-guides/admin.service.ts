import api from "../../lib/axios";
import type { CropGuideAdminRequest, CropGuideAdminResponse } from "./adminTypes";

const unwrap = <T>(res: any): T => res?.data?.data as T;

export const cropGuideAdminService = {
    async list(): Promise<CropGuideAdminResponse[]> {
        const res = await api.get("/crop-guides/admin/crop-guides");
        return unwrap<CropGuideAdminResponse[]>(res) ?? [];
    },

    async getById(id: string): Promise<CropGuideAdminResponse> {
        const res = await api.get(`/crop-guides/admin/crop-guides/${id}`);
        return unwrap<CropGuideAdminResponse>(res);
    },

    async create(payload: CropGuideAdminRequest): Promise<CropGuideAdminResponse> {
        const res = await api.post("/crop-guides/admin/crop-guides", payload);
        return unwrap<CropGuideAdminResponse>(res);
    },

    async update(id: string, payload: CropGuideAdminRequest): Promise<CropGuideAdminResponse> {
        const res = await api.put(`/crop-guides/admin/crop-guides/${id}`, payload);
        return unwrap<CropGuideAdminResponse>(res);
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/crop-guides/admin/crop-guides/${id}`);
    },
};

