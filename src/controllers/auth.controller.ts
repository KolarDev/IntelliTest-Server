import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { RegisterOrgRequest, LoginRequest, CreateStaffRequest, CreateStudentRequest, AuthenticatedRequest } from '../types/auth.types';

const router = Router();
const authService = new AuthService();

// Organization Registration
export const register = async (req: Request, res: Response) => {
    const data: RegisterOrgRequest = req.body;
    const result = await authService.registerOrganization(data);
    
    res.status(201).json({
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
const staff = 
  async (req: AuthenticatedRequest, res: Response) => {
      const data: CreateStaffRequest = req.body;
      const staff = await authService.createStaff(req.user.organizationId!, data);
      
      res.status(201).json({
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
const createStudent =  async (req: AuthenticatedRequest, res: Response) => {
      const data: CreateStudentRequest = req.body;
      const student = await authService.createStudent(
        req.user.organizationId!,
        req.user.userId,
        data
      );
      
      res.status(201).json({
        message: 'Student created successfully',
        student: {
          id: student.id,
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.student?.studentId,
        },
      });
   
  }


export default router;