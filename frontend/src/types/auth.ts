export interface User {
  id?: string;
  email: string;
  // Add other user fields as needed based on backend response
  firstName?: string;
  lastName?: string;
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
}

export interface AuthResponse {
  message: string;
  email: string;
  token: string;
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
