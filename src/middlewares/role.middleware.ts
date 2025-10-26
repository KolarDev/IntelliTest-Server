import { Request, Response, NextFunction } from 'express';
import { TestService } from '../services/test.service';
import { catchAsync } from '../utils/catchAsync'; // Assuming the utility path
import { JWTPayload } from '../types/auth.types'; // Assuming this type includes id, role, organizationId


// Ensure only Org Admins or Staff can access test creation routes
export const restrictToStaff = (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (role !== 'ORG_ADMIN' && role !== 'STAFF') {
        return res.status(403).json({
            status: 'fail',
            message: 'You do not have permission to perform this action.',
        });
    }
    next();
};