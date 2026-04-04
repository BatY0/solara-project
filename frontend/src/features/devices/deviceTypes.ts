export interface EspDeviceResponse {
    id: string;
    serialNumber: string;
    status: string;
    pairedFieldName?: string;
    pairedFieldId?: string;
    createdAt: string;
}

export interface EspDeviceRequest {
    serialNumber: string;
    status: string;
}
