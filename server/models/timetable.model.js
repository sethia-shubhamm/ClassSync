import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    subjects: [
        {
            name: {
                type: String,
                required: true,
            },
            days: [String], // ['Monday', 'Tuesday', etc]
        }
    ],
    scannedAt: {
        type: Date,
        default: null, // null if manually entered, date if scanned from image
    },
}, { timestamps: true });

const Timetable = mongoose.model("Timetable", timetableSchema);

export default Timetable;
