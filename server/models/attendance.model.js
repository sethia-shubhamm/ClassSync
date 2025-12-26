import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    subjectName: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'cancelled'],
        default: 'present',
    },
    isRescheduled: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Index for faster queries
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ userId: 1, subjectName: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
