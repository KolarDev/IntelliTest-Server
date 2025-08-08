import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
  id: number;
  email: string;
  role: UserRole;
  organizationId?: string;
  iat: number;
  exp: number;
}

export interface RegisterOrgRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  domain?: string;
}

export interface CreateStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  permissions?: Record<string, boolean>;
}

export interface CreateStudentRequest {
  email: string;
  firstName: string;
  lastName: string;
  studentId: string;
  metadata?: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}