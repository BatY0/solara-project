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
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  // user?: User; // Depending on if login returns user object or just token
}
