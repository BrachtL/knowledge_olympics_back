const { Router } = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const examController = require('../controllers/examController');

const router = Router();

//AUTH
router.post('/login', authController.login_post); //todo: is it good?
//router.post('/login/teacher', authController.login_teacher_post);
router.get('/tokenTest', requireAuth, (req, res) => {res.send("All Right")});
router.get('/logout', requireAuth, authController.logout_get);


//QUESTIONS
//get exam with previous marked answers (in case of blackout, for instance)
router.get('/exam', requireAuth, examController.exam_get);

//post exam when finished by clickong on finish button
router.post('/exam', requireAuth, examController.exam_post);

//post an answer everytime change an answer (just that answer)
router.post('/answer', requireAuth, examController.answer_post);

//get questions for a particular teacher
router.get('/questions', requireAuth, examController.questions_get);

//post questions for a particular teacher
router.post('/questions', requireAuth, examController.questions_post)


const teste = process.env.BFT_DB_HOST;
module.exports = { router, teste }