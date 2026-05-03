export type PreferredLanguage = 'en' | 'tr';

export interface User {
    id?: string;
    email: string;
    name?: string;
    surname?: string;
    role?: string;
    preferredLanguage?: PreferredLanguage;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    surname: string;
    email: string;
    password: string;
    preferredLanguage?: PreferredLanguage;
}

export interface AuthResponse {
    message: string;
    email: string;
    token: string;
    refreshToken?: string;
    emailVerified?: boolean;
}

export interface VerifyRequestPayload {
    email: string;
}

export interface VerifyConfirmPayload {
    email: string;
    code: string;
}

export interface VerifyResponse {
    message: string;
    isVerified?: boolean;
}

export interface ResetPasswordPayload {
    email: string;
    newPassword: string;
    code: string;
}
