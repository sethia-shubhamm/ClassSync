import Attendance from '../models/attendance.model.js';
import Timetable from '../models/timetable.model.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayName = getDayName(today.getDay());

    // Get user's timetable
    const timetable = await Timetable.findOne({ userId });

    if (!timetable) {
        return res.status(404).json({ message: 'Please setup timetable first' });
    }

    // Get today's subjects based on timetable
    const todaySubjects = timetable.subjects.filter(s => s.days.includes(dayName));

    // Ensure attendance records exist for today's subjects
    for (const subject of todaySubjects) {
        const existingAttendance = await Attendance.findOne({
            userId,
            subjectName: subject.name,
            date: today,
        });

        if (!existingAttendance) {
            await new Attendance({
                userId,
                subjectName: subject.name,
                date: today,
                status: 'present',
                isRescheduled: false,
            }).save();
        }
    }

    // Get today's attendance
    const todayAttendance = await Attendance.find({
        userId,
        date: today,
    });

    // Get all subjects with overall attendance
    const allAttendance = {};

    for (const subject of timetable.subjects) {
        const records = await Attendance.find({
            userId,
            subjectName: subject.name,
        });

        const presentCount = records.filter(r => r.status === 'present').length;
        const totalCount = records.filter(r => r.status !== 'cancelled').length;
        const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

        allAttendance[subject.name] = {
            percentage: parseFloat(percentage.toFixed(1)),
            present: presentCount,
            total: totalCount,
        };
    }

    res.json({
        user: { name: req.user.name, email: req.user.email },
        todaySubjects: todaySubjects.map(s => ({ _id: s.name, name: s.name })),
        allSubjects: timetable.subjects.map(s => ({ _id: s.name, name: s.name })),
        attendance: allAttendance,
    });
});

export const getSubjectAttendance = asyncHandler(async (req, res) => {
    const { subjectName } = req.params;
    const userId = req.user.id;

    const records = await Attendance.find({
        userId,
        subjectName,
    }).sort({ date: -1 });

    const timetable = await Timetable.findOne({ userId });
    const subject = timetable.subjects.find(s => s.name === subjectName);

    if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
    }

    const presentCount = records.filter(r => r.status === 'present').length;
    const totalCount = records.filter(r => r.status !== 'cancelled').length;
    const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

    res.json({
        subject: { _id: subjectName, name: subjectName },
        attendance: records,
        summary: { percentage: percentage.toFixed(1), present: presentCount, total: totalCount },
    });
});

export const markAttendance = asyncHandler(async (req, res) => {
    const { subjectName } = req.params;
    const { status, date } = req.body;
    const userId = req.user.id;

    if (!['present', 'absent', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
        userId,
        subjectName,
        date: attendanceDate,
    });

    if (!attendance) {
        attendance = new Attendance({
            userId,
            subjectName,
            date: attendanceDate,
            status,
        });
    } else {
        attendance.status = status;
    }

    await attendance.save();

    res.json({ message: 'Attendance marked', attendance });
});

export const updateAttendanceRecord = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['present', 'absent', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const attendance = await Attendance.findOne({ _id: recordId, userId });

    if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
    }

    attendance.status = status;
    await attendance.save();

    res.json({ message: 'Attendance updated', attendance });
});

export const addRescheduledClass = asyncHandler(async (req, res) => {
    const { subjectName } = req.params;
    const { date } = req.body;
    const userId = req.user.id;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = new Attendance({
        userId,
        subjectName,
        date: attendanceDate,
        status: 'present',
        isRescheduled: true,
    });

    await attendance.save();

    res.status(201).json({ message: 'Rescheduled class added', attendance });
});

function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}
