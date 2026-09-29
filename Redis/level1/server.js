import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./configs/connectDB.js";
import User from "./models/user.model.js";
import Redis from "ioredis";
import rateLimitter from "./middlewares/rateLimiter.js";
import emailQueue from "./configs/queue.js";

const app = express();

connectDB();

const port = process.env.PORT;

app.use(express.json());

export const redis = new Redis(process.env.REDIS_URL);

app.get("/", rateLimitter, (req, res) => {
  res.send({ message: "Message from redis" });
});

// api to create user
app.post("/create", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    await redis.del("user:all");
    const user = await User.create({
      name,
      email,
      password,
    });
    return res.status(201).json({
      message: "User created",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

//get users
app.get("/getUser", rateLimitter, async (req, res) => {
  try {
    const user = await User.find();

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
  }
});

//get data with redis
app.get("/getUser-withRedis", async (req, res) => {
  try {
    const cachedData = await redis.get("user:all");
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    const users = await User.find();
    await redis.set("user:all", JSON.stringify(users));
    return res.json(users);
  } catch (error) {
    console.log(error);
  }
});

//send otp
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // here we used toString bcs data stored in string in redis
    await redis.set(`otp:${email}`, otp, "EX", 60);
    return res.json({ otp });
  } catch (error) {
    console.log(error);
  }
});

//verify otp
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cachedOtp = await redis.get(`otp:${email}`);
    if (!cachedOtp) {
      return res.status(400).json({ message: "Otp expired or not found" });
    }

    if (otp !== cachedOtp) {
      return res.json({ message: "Incorrect OTP" });
    }
    //delete after verified
    await redis.del(`otp:${email}`);

    return res.json({ message: "OTP Verified" });
  } catch (error) {
    console.log(error);
  }
});

// api to create user and send email with - queue
app.post("/create-queue", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    await redis.del("user:all");
    const user = await User.create({
      name,
      email,
      password,
    });

    await emailQueue.add("send-email", { email });

    return res.status(201).json({
      message: "User created",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
