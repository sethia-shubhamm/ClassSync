import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/db.js";
import app from "./app.js";
import { setupDailyAttendanceCron } from "./utils/cron.js";

const port = process.env.PORT || 8000;

connectDB().then(() => {
    // Start cron job for daily attendance
    setupDailyAttendanceCron();

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        console.log('Daily attendance cron initialized');
    });
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
});