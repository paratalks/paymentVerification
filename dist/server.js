"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const razorpay_1 = __importDefault(require("razorpay"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json()); // Parse JSON bodies
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
// Initialize Razorpay instance
const razorpay = new razorpay_1.default({
    key_id: process.env.RZP_KEY_ID || "", // Use your environment variable
    key_secret: process.env.RZP_KEY_SECRET || "", // Use your environment variable
});
const generateSignature = (razorpayOrderId, razorpayPaymentId) => {
    const keySecret = process.env.RZP_KEY_SECRET;
    if (!keySecret) {
        throw new Error("Razorpay key secret is not defined in environment variables.");
    }
    return crypto_1.default
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");
};
// Route to create an order
app.post("/api/create-order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount,
            currency: "INR",
            receipt: "rcp1", // Customize as needed
        };
        const order = yield razorpay.orders.create(options);
        res.status(200).json({ orderId: order.id });
    }
    catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
}));
// Route to verify payment
app.post("/api/verify-payment", (req, res) => {
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
    }
    catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).json({ error: "Failed to verify payment" });
    }
});
// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
