"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const app_1 = require("./app");
// Initialize database schema before accepting requests
(0, db_1.initDb)();
const app = (0, app_1.createApp)();
const port = parseInt(process.env.PORT ?? '3000', 10);
app.listen(port, () => {
    console.log(`Todo API server running on port ${port}`);
});
//# sourceMappingURL=server.js.map