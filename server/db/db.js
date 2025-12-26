import mongoose from "mongoose";

const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
        throw new Error("MONGO_URI is not defined in environment variables");
    }
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
};

export default connectDB;