import { Router } from "express";
import { 
    getDashboard, 
    getSubjectAttendance, 
    markAttendance,
    updateAttendanceRecord,
    addRescheduledClass 
} from "../contollers/attendance.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/dashboard', authMiddleware, getDashboard);
router.get('/subjects/:subjectName/attendance', authMiddleware, getSubjectAttendance);
router.post('/:subjectName/mark', authMiddleware, markAttendance);
router.put('/:recordId', authMiddleware, updateAttendanceRecord);
router.post('/:subjectName/add-class', authMiddleware, addRescheduledClass);

export default router;
