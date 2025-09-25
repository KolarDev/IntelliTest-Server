import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config/envSchema';
import { Email } from './email.service';
import { AppError } from '../utils/appError';
import { JWTPayload, AuthTokens, RegisterOrgRequest, CreateStaffRequest, CreateStudentRequest } from '../types/auth.types';

export class AuthService {
  private readonly JWT_SECRET = config.JWT_SECRET;
  private readonly JWT_REFRESH_SECRET = config.JWT_REFRESH_SECRET;
  private readonly JWT_EXPIRES_IN = config.JWT_ACCESS_EXPIRES_IN;
  private readonly JWT_REFRESH_EXPIRES_IN = config.JWT_REFRESH_EXPIRES_IN;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens {
    const accessToken = jwt.sign(payload, this.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: this.JWT_EXPIRES_IN
      } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET,
      {
        algorithm: "HS256",
        expiresIn: this.JWT_REFRESH_EXPIRES_IN
      } as jwt.SignOptions
    );

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
      id: user.id,
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
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
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
      id: user.id,
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

  
  async refreshTokens(refreshToken: string) {
    let decoded: JWTPayload;
    try {
      decoded = this.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError("Invalid or expired refresh token", 403);
    }
  
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id },
      include: {
        organization: true,
        staff: { include: { organization: true } },
        student: { include: { organization: true } },
      },
    });
    if (!user) {
      throw new AppError("User not found or refresh token invalid", 403);
    }
  
    // Generate new tokens
    const organizationId = user.organization?.id || user.staff?.organizationId || user.student?.organizationId;
  
    const newTokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId,
    });
  
    return newTokens;
  }

  async logout(refreshToken: string) {
    let decoded: JWTPayload;
    try {
      decoded = this.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError("Invalid or expired refresh token", 403);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      throw new AppError("User not found or refresh token invalid", 403);
    }

    // Since we don't store refresh tokens in the database,
    // we simply clear the cookie on the client side.
    // The token will eventually expire on its own.
  }

  // Helper method to handle OTP logic
  private async _handleOtp(email: string, template: string, subject: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("No user with that email", 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await prisma.user.update({
      where: { email },
      data: { otpCode: otp, otpExpiresAt: expires, isVerified: false }, // Set isVerified to false
    });
    
    // Use firstName as the user's name in the email
    const userName = user.firstName;

    await new Email(user.email, {
      user,
      extraData: { otp, userName }
    }).send(template, subject);
  }

  async sendOtp(email: string) {
    await this._handleOtp(email, "sendOtp", "Your IntelliTest OTP Code");
  }

  async verifyOtp(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    await prisma.user.update({
      where: { email },
      data: { otpCode: null, otpExpiresAt: null, isVerified: true }, // Set to verified
    });
  }

  async forgotPassword(email: string) {
    await this._handleOtp(email, "forgotPasswordOtp", "Reset Your Password");
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
        otpCode: null,
        otpExpiresAt: null,
      },
    });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new AppError("User not found", 404);
    return user;
  }
}