import express from "express";
import Razorpay from "razorpay";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import cors from "cors";

dotenv.config();

const app = express();
app.use(bodyParser.json()); // Parse JSON bodies
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RZP_KEY_ID || "", // Use your environment variable
    key_secret: process.env.RZP_KEY_SECRET || "", // Use your environment variable
});

const generateSignature = (razorpayOrderId:any, razorpayPaymentId:any) => {
    const keySecret = process.env.RZP_KEY_SECRET;
    if (!keySecret) {
        throw new Error("Razorpay key secret is not defined in environment variables.");
    }
    return crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");
};

// Route to create an order
app.post("/api/create-order", async (req:any, res:any) => {
    try {
        const { amount } = req.body;

        const options = {
            amount: amount,
            currency: "INR",
            receipt: "rcp1", // Customize as needed
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ orderId: order.id });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
});

// Route to verify payment
app.post("/api/verify-payment", (req:any, res:any) => {
    try {
        const { orderCreationId, razorpayPaymentId, razorpaySignature } = req.body;

        const generatedSig = generateSignature(orderCreationId, razorpayPaymentId);

        if (generatedSig !== razorpaySignature) {
            return res.status(400).json({
                message: "Payment verification failed",
                isOk: false,
            });
        }

        return res.status(200).json({
            message: "Payment verified successfully",
            isOk: true,
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).json({ error: "Failed to verify payment" });
    }
});
// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
