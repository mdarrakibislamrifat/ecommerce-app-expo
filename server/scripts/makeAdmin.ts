import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

const makeAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const user = await User.findOneAndUpdate({ email }, { role: "admin" });

    if (user) {
      await clerkClient.users.updateUserMetadata(
        user.clerkId as string,
        { publicMetadata: { role: "admin" } }
      );
    }
  } catch (err:any) {
    console.log("Admin promotion error:", err.message);
  }
};


export default makeAdmin;