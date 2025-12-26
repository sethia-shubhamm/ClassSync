import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { setupTimetable, getTimetable, updateTimetable, scanTimetable } from "../contollers/timetable.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Configure multer for temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

const router = Router();

router.post('/setup', authMiddleware, setupTimetable);
router.get('/', authMiddleware, getTimetable);
router.put('/', authMiddleware, updateTimetable);

router.post('/scan', authMiddleware, (req, res, next) => {
    console.log('📸 Timetable scan endpoint called');
    console.log('File:', req.file ? req.file.originalname : 'No file');
    upload.single('timetableImage')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.log('Multer error:', err.message);
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        } else if (err) {
            console.log('Upload error:', err.message);
            return res.status(400).json({ message: err.message || 'File upload failed' });
        }
        console.log('✅ File uploaded successfully');
        next();
    });
}, scanTimetable);

export default router;
