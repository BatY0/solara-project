import api from '../api/api';
import type {
    Field,
    FieldProperties,
    CreateFieldRequest,
    CreateFieldResponse,
    UpdateFieldPropertiesRequest,
} from '../types/fields';

export const fieldsService = {
    getUserFields: async (): Promise<Field[]> => {
        const response = await api.get('/fields/user-fields');
        return response.data;
    },

    getFieldById: async (id: string): Promise<Field> => {
        const response = await api.get(`/fields/${id}`);
        return response.data;
    },

    getFieldProperties: async (id: string): Promise<FieldProperties> => {
        const response = await api.get(`/fields/get-properties-with-field-id/${id}`);
        return response.data;
    },

    createField: async (data: CreateFieldRequest): Promise<CreateFieldResponse> => {
        const response = await api.post('/fields/create-field', data);
        return response.data;
    },

    updateFieldProperties: async (
        id: string,
        data: UpdateFieldPropertiesRequest,
    ): Promise<FieldProperties> => {
        const response = await api.put(`/fields/field-properties/${id}`, data);
        return response.data;
    },

    deleteField: async (id: string): Promise<void> => {
        await api.delete(`/fields/${id}`);
    },
};
