import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

//routes
import authRoutes from './routes/auth.route.js';
import timetableRoutes from './routes/timetable.route.js';
import attendanceRoutes from './routes/attendance.route.js';

const app = express();

// Middleware - must come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [process.env.CORS_ORIGIN, 'http://localhost:5174'],
    credentials: true,
}));
app.use(cookieParser());

//sample route
app.get('/', (req, res) => {
    res.send('API is running...');
});

//auth routes
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);



export default app;