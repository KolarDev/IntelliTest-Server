import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { RegisterOrgRequest, LoginRequest, CreateStaffRequest, CreateStudentRequest, AuthenticatedRequest } from '../types/auth.types';

const router = Router();
const authService = new AuthService();

// Organization Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Create Staff (Organization Admin only)
router.post('/staff', 
  authenticate, 
  authorize('ORG_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
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
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Create Student (Organization Admin or Staff)
router.post('/students',
  authenticate,
  authorize('ORG_ADMIN', 'STAFF'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
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
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get current user profile
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  // Implementation to get full user profile based on role
});

// Logout
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  // Implementation to blacklist token
});

export default router;