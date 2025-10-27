import express from 'express';
import { authenticate } from '../middlewares/auth.middleware'; // Assumed auth middleware
import { createClass, getClasses, enrollStudents, removeStudentFromClass, assignTest, } from '../controllers/class.controller';
import { restrictToStaff } from '../middlewares/role.middleware';

const router = express.Router();

router.use(authenticate); // All routes below are protected
router.use(restrictToStaff); // All class management requires staff/admin role

router.route('/')
  .post(createClass)
  .get(getClasses);
  
router.route('/:classId/enroll')
  .post(enrollStudents);

router.route('/:classId/students/:studentId')
  .delete(removeStudentFromClass);

// Test Assignment Route
router.route('/assignments')
  .post(assignTest);
  
export default router;