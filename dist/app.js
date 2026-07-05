"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const todos_1 = __importDefault(require("./routes/todos"));
const errorHandler_1 = require("./middleware/errorHandler");
function createApp() {
    const app = (0, express_1.default)();
    // CORS — strip trailing slash to avoid browser origin mismatch
    const corsOrigin = (process.env.CORS_ORIGIN || '*').replace(/\/$/, '');
    app.use((0, cors_1.default)({
        origin: corsOrigin,
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type'],
    }));
    // Parse JSON bodies — triggers entity.parse.failed on malformed JSON
    app.use(express_1.default.json());
    // Mount todos router
    app.use('/todos', todos_1.default);
    // 404 catch-all for undefined routes
    app.use((_req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });
    // Global error handler (must be last)
    app.use(errorHandler_1.errorHandler);
    return app;
}
exports.createApp = createApp;
//# sourceMappingURL=app.js.map