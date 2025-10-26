import express from 'express';
import { authenticate } from '../middlewares/auth.middleware'; // Assumed auth middleware
import { createTest, addQuestionToTest, getTestDetails, publishTest } from '../controllers/test.controller';
import { restrictToStaff } from '../middlewares/role.middleware';
const router = express.Router();

router.use(authenticate); // All routes below are protected

// Apply role restriction middleware globally for test management
router.use(restrictToStaff); 

router.route('/')
  .post(createTest);

router.route('/:testId')
  .get(getTestDetails);
  
router.route('/:testId/questions')
  .post(addQuestionToTest);

router.route('/:testId/publish')
  .patch(publishTest);
  
export default router;