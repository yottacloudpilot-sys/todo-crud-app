import { initDb } from './db';
import { createApp } from './app';

// Initialize database schema before accepting requests
initDb();

const app = createApp();
const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen(port, () => {
  console.log(`Todo API server running on port ${port}`);
});
