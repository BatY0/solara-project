import api from '../../lib/axios';
import type {
    Field,
    FieldProperties,
    CreateFieldRequest,
    CreateFieldResponse,
    UpdateFieldPropertiesRequest
} from './types';

export const fieldsService = {
    // Get all fields for the currently authenticated user
    getUserFields: async (): Promise<Field[]> => {
        const response = await api.get('/fields/user-fields');
        return response.data;
    },

    // Get field by ID
    getFieldById: async (id: string): Promise<Field> => {
        const response = await api.get(`/fields/${id}`);
        return response.data;
    },

    // Get properties for a specific field
    getFieldProperties: async (id: string): Promise<FieldProperties> => {
        const response = await api.get(`/fields/get-properties-with-field-id/${id}`);
        return response.data;
    },

    // Create a new field
    createField: async (data: CreateFieldRequest): Promise<CreateFieldResponse> => {
        const response = await api.post('/fields/create-field', data);
        return response.data;
    },

    // Update field properties
    updateFieldProperties: async (id: string, data: UpdateFieldPropertiesRequest): Promise<FieldProperties> => {
        const response = await api.put(`/fields/field-properties/${id}`, data);
        return response.data;
    },

    // Delete field
    deleteField: async (id: string): Promise<void> => {
        await api.delete(`/fields/${id}`);
    }
};
