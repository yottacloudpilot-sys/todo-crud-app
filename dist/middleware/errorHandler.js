"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const todosService_1 = require("../services/todosService");
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    // Handle express.json() parse errors (malformed JSON)
    if (err.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'Invalid JSON in request body' });
        return;
    }
    // Handle validation errors from the service layer
    if (err instanceof todosService_1.ValidationError) {
        res.status(400).json({ error: err.message });
        return;
    }
    // Unexpected errors → 503
    console.error('Unexpected error:', err);
    res.status(503).json({ error: 'Service temporarily unavailable' });
}
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map