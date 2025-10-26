import express from 'express';
// import { protect } from '../middlewares/auth.middleware'; // Assumed auth middleware

const router = express.Router();

router.use(protect); // All routes below are protected

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
*/