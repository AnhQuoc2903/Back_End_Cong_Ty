"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 👇 IMPORT NÀY ĐỂ ĐĂNG KÝ TẤT CẢ CÁC MODEL VỚI MONGOOSE
require("./models");
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const port = process.env.PORT || 4000;
(0, db_1.connectDB)().then(() => {
    app_1.default.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
});
