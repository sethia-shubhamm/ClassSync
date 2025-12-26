import cron from 'node-cron';
import Timetable from '../models/timetable.model.js';
import Attendance from '../models/attendance.model.js';

// Run every day at 6:00 AM
export const setupDailyAttendanceCron = () => {
    cron.schedule('0 6 * * *', async () => {
        try {
            console.log('Running daily attendance setup...');

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayName = getDayName(today.getDay());

            // Get all timetables
            const allTimetables = await Timetable.find();

            for (const timetable of allTimetables) {
                // Get today's subjects
                const todaySubjects = timetable.subjects.filter(s => s.days.includes(dayName));

                // Create attendance records for each subject
                for (const subject of todaySubjects) {
                    const existingAttendance = await Attendance.findOne({
                        userId: timetable.userId,
                        subjectName: subject.name,
                        date: today,
                    });

                    if (!existingAttendance) {
                        await new Attendance({
                            userId: timetable.userId,
                            subjectName: subject.name,
                            date: today,
                            status: 'present',
                            isRescheduled: false,
                        }).save();

                        console.log(`Created attendance for ${subject.name} on ${today.toDateString()}`);
                    }
                }
            }

            console.log('Daily attendance setup completed');
        } catch (error) {
            console.error('Error in daily attendance cron:', error);
        }
    });
};

function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}
