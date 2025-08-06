// services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWTPayload, AuthTokens } from '../types/auth.types';

const prisma = new PrismaClient();

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private readonly JWT_EXPIRE = '15m';
  private readonly JWT_REFRESH_EXPIRE = '7d';

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens {
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRE,
    });

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRE,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 * 1000, // 15 minutes in ms
    };
  }

  verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
  }

  verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_REFRESH_SECRET) as JWTPayload;
  }

  async registerOrganization(data: RegisterOrgRequest) {
    const hashedPassword = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'ORG_ADMIN',
        organization: {
          create: {
            name: data.organizationName,
            domain: data.domain,
          },
        },
      },
      include: {
        organization: true,
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization?.id,
    });

    return { user, tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        staff: { include: { organization: true } },
        student: { include: { organization: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Get organization ID based on role
    let organizationId: string | undefined;
    if (user.organization) organizationId = user.organization.id;
    else if (user.staff) organizationId = user.staff.organization.id;
    else if (user.student) organizationId = user.student.organization.id;

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId,
    });

    return { user, tokens };
  }

  async createStaff(organizationId: string, data: CreateStaffRequest) {
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await this.hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'STAFF',
        staff: {
          create: {
            organizationId,
            department: data.department,
            position: data.position,
            permissions: data.permissions || {},
          },
        },
      },
      include: {
        staff: true,
      },
    });

    // TODO: Send email with temporary password
    console.log(`Staff created. Temporary password: ${tempPassword}`);

    return user;
  }

  async createStudent(organizationId: string, creatorId: string, data: CreateStudentRequest) {
    // Generate simple password based on student ID
    const password = `${data.studentId}@123`;
    const hashedPassword = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'STUDENT',
        student: {
          create: {
            organizationId,
            studentId: data.studentId,
            createdBy: creatorId,
            metadata: data.metadata || {},
          },
        },
      },
      include: {
        student: true,
      },
    });

    // TODO: Send email with credentials
    console.log(`Student created. Password: ${password}`);

    return user;
  }
}