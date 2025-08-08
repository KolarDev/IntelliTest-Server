import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRole } from '@prisma/client';
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";

const authService = new AuthService();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    const token = (req.headers['authorization'] as string | undefined)?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const payload = authService.verifyAccessToken(token);
    req.user = payload;
    next();
};


export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireSameOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const organizationId = req.params?.organizationId || req.body?.organizationId;
  
  if (req.user?.organizationId !== organizationId) {
    return res.status(403).json({ error: 'Access denied to this organization' });
  }
  
  next();
};












// import { Request, Response, NextFunction } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import { catchAsync } from "../utils/catchAsync";
// import { AppError } from "../utils/appError";

// const JWT_SECRET = process.env.JWT_SECRET!;

// // Define expected payload shape
// interface RefreshTokenPayload extends JwtPayload {
//   id: number;
// }

// export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith("Bearer ")) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   const token = authHeader.split(" ")[1];
//   let decoded: RefreshTokenPayload;
//    try {
//      decoded = jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;
//    } catch (err) {
//      throw new AppError("Invalid or expired refresh token", 403);
//    }
//   if (!decoded) return res.status(401).json({ error: "Invalid token" });

//   req.user = { id: decoded.id }; 
//   next();

// });
