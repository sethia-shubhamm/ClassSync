import Timetable from '../models/timetable.model.js';
import Attendance from '../models/attendance.model.js';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export const setupTimetable = asyncHandler(async (req, res) => {
    const { timetable } = req.body;
    const userId = req.user.id; // Assuming auth middleware sets user

    if (!timetable || timetable.length === 0) {
        return res.status(400).json({ message: 'Timetable is required' });
    }

    let userTimetable = await Timetable.findOne({ userId });

    if (userTimetable) {
        userTimetable.subjects = timetable;
        await userTimetable.save();
    } else {
        userTimetable = new Timetable({ userId, subjects: timetable });
        await userTimetable.save();
    }

    // Create attendance records for today and future days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayName = getDayName(today.getDay());

    const todaySubjects = timetable.filter(s => s.days.includes(dayName));

    for (const subject of todaySubjects) {
        const existingAttendance = await Attendance.findOne({
            userId,
            subjectName: subject.name,
            date: today,
        });

        if (!existingAttendance) {
            new Attendance({
                userId,
                subjectName: subject.name,
                date: today,
                status: 'present',
                isRescheduled: false,
            }).save();
        }
    }

    res.status(201).json({ message: 'Timetable setup complete', timetable: userTimetable });
});

export const getTimetable = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const timetable = await Timetable.findOne({ userId });

    if (!timetable) {
        return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json({
        ...timetable.toObject(),
        hasScanned: !!timetable.scannedAt,
    });
});

export const updateTimetable = asyncHandler(async (req, res) => {
    const { timetable } = req.body;
    const userId = req.user.id;

    let userTimetable = await Timetable.findOne({ userId });

    if (!userTimetable) {
        return res.status(404).json({ message: 'Timetable not found' });
    }

    userTimetable.subjects = timetable;
    await userTimetable.save();

    res.json({ message: 'Timetable updated', timetable: userTimetable });
});

function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

export const scanTimetable = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;

    // Check upload count
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has already uploaded 2 times
    if (user.uploadCount >= 2) {
        return res.status(400).json({ message: '❌ Upload limit reached! You can only upload timetable 2 times. Please edit your timetable manually if needed.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        // Use buffer directly from memory
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        const prompt = `Please analyze ONLY the main timetable grid (NOT the reference table at the bottom) and extract the subjects and their scheduled days.
        
        CRITICAL:
        - Extract data ONLY from the main timetable schedule grid with time slots and days
        - IGNORE any reference/legend table below the grid
        - Use subject codes from the grid (PSE, DMS, AI, MVA, EEFM, etc.)
        - Do NOT look for full names - use codes as they appear in the grid
        - For each subject code, list ALL days it appears
        
        Return ONLY a valid JSON object with NO additional text:
        {
            "subjects": [
                {
                    "name": "Subject Code from grid",
                    "days": ["Monday", "Wednesday", "Friday"]
                }
            ]
        }
        
        IMPORTANT RULES:
        1. Extract subject CODES as shown in the timetable grid (e.g., PSE, DMS, AI, MVA, EEFM, PSE-LAB, DMS-LAB)
        2. For each subject, list ALL days it appears on in the grid
        3. Days must be: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
        4. Remove ALL duplicates - each subject code appears only ONCE in the output with all its days
        5. Ignore time slots and room numbers
        6. Do NOT include any text from the reference table below
        7. Return ONLY the JSON object, no markdown, no extra text
        
        Example output format:
        {"subjects": [{"name": "PSE", "days": ["Monday", "Wednesday", "Thursday", "Friday"]}, {"name": "DMS", "days": ["Monday", "Wednesday", "Friday"]}]}`;

        const response = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
            prompt,
        ]);

        const responseText = response.response.text();
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return res.status(400).json({ message: 'Could not parse timetable from image' });
        }

        const extractedData = JSON.parse(jsonMatch[0]);

        // Fetch existing timetable if it exists
        const existingTimetable = await Timetable.findOne({ userId });

        // Save or update timetable with scannedAt timestamp
        let userTimetable = existingTimetable;
        
        if (userTimetable) {
            // Update existing timetable
            userTimetable.subjects = extractedData.subjects || [];
            userTimetable.scannedAt = new Date();
        } else {
            // Create new timetable
            userTimetable = new Timetable({
                userId,
                subjects: extractedData.subjects || [],
                scannedAt: new Date(),
            });
        }
        
        await userTimetable.save();

        // Increment upload count
        user.uploadCount += 1;
        await user.save();

        // Create attendance records for today and future days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayName = getDayName(today.getDay());
        const todaySubjects = (extractedData.subjects || []).filter(s => s.days.includes(dayName));

        for (const subject of todaySubjects) {
            const existingAttendance = await Attendance.findOne({
                userId,
                subjectName: subject.name,
                date: today,
            });

            if (!existingAttendance) {
                new Attendance({
                    userId,
                    subjectName: subject.name,
                    date: today,
                    status: 'present',
                    isRescheduled: false,
                }).save();
            }
        }

        // No need to clean up - using memory storage

        res.json({
            message: `Timetable scanned successfully! (${user.uploadCount}/2 uploads used)`,
            subjects: extractedData.subjects || [],
            timetable: userTimetable,
        });
    } catch (error) {
        // Clean up the image file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        if (error instanceof SyntaxError) {
            return res.status(400).json({ message: 'Failed to parse timetable from image. Please try again.' });
        }
        throw error;
    }
});
