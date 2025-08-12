import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { RegisterOrgRequest, LoginRequest, CreateStaffRequest, CreateStudentRequest } from '../types/auth.types';
import { catchAsync } from 'utils/catchAsync';

const authService = new AuthService();

// Organization Registration
export const registerOrg = async (req: Request, res: Response) => {
    const data: RegisterOrgRequest = req.body;
    const result = await authService.registerOrganization(data);
    
    res.status(201).json({
      status: "success",
      message: 'Organization registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        organization: result.user.organization,
      },
      tokens: result.tokens,
    });
  
};

// Login
export const login = async (req: Request, res: Response) => {
    const { email, password }: LoginRequest = req.body;
    const result = await authService.login(email, password);
    
    res.json({
      status: "success",
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      tokens: result.tokens,
    });
 
};

// Create Staff (Organization Admin only)
export const createStaff = 
  async (req: Request, res: Response) => {
      const data: CreateStaffRequest = req.body;
      const staff = await authService.createStaff(req.user?.organizationId!, data);
      
      res.status(201).json({
        status: "success",
        message: 'Staff created successfully',
        staff: {
          id: staff.id,
          email: staff.email,
          firstName: staff.firstName,
          lastName: staff.lastName,
          department: staff.staff?.department,
          position: staff.staff?.position,
        },
      });
   
  }

// Create Student (Organization Admin or Staff)
export const createStudent =  async (req: Request, res: Response) => {
  const data: CreateStudentRequest = req.body;
  const student = await authService.createStudent(
    req.user?.organizationId!,
    req.user?.id!,
    data
  );
  console.log(student);
  
  res.status(201).json({
    status: "success",
    message: 'Student created successfully',
    student
  });   
}

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token: string | undefined = req.cookies?.refreshToken;

  if (!token) {
    throw new AppError("No refresh token provided", 401);
  }

  const newTokens = await authService.refreshTokens(token);
  
  // Set the new refresh token in a cookie
  res.cookie("refreshToken", newTokens.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "PRODUCTION",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ 
    status: "success",
    accessToken: newTokens.accessToken,
    expiresIn: newTokens.expiresIn
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.status(200).json({
    status: "success",
    message: "Logged out" 
  });
});

export const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.sendOtp(email);
  res.status(200).json({ 
    status: "success",
    message: "OTP sent to email" 
  });
});

export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await authService.verifyOtp(email, otp);
  res.status(200).json({ 
    status: "success",
    message: "OTP verified" 
  });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  res.status(200).json({ 
    status: "success",
    message: "Reset Password OTP sent to email" 
  });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  await authService.resetPassword(email, otp, newPassword);
  res.status(200).json({
    status: "success",
    message: "Password reset successful" 
  });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({
    status: "success",
    user
  });
});
