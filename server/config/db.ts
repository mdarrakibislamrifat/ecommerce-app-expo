import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns"; 

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in the environment variables.");
        }
        dns.setServers(["8.8.8.8", "1.1.1.1"]);

        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}

export default connectDB;