import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/db.js";
import app from "./app.js";
import { setupDailyAttendanceCron } from "./utils/cron.js";

const port = process.env.PORT || 8000;

// Initialize database and cron on startup
connectDB().then(() => {
    setupDailyAttendanceCron();
    console.log('Database connected and cron initialized');
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

// Export app for Vercel serverless
export default app;