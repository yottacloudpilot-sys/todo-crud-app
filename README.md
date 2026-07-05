# Todo CRUD App

A full-stack Todo app with a Node.js/Express/TypeScript backend and a vanilla JS frontend.

## Local Development

```bash
npm install
npm run dev        # starts backend on http://localhost:3000
```

Open `public/index.html` in a browser or serve it with any static server.

## Deployment

### Backend (Render)
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` and configure the service
5. Add the `CORS_ORIGIN` environment variable in the Render dashboard (set to your Netlify URL)
6. Deploy — your API will be at `https://todo-crud-api.onrender.com`

### Frontend (Netlify)
1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Connect your GitHub repo
3. Set publish directory to `public` (netlify.toml handles this automatically)
4. Deploy — your frontend will be at `https://<your-site>.netlify.app`
5. Update `API_BASE` in `public/index.html` with your actual Render URL

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /todos | List all todos |
| POST | /todos | Create a todo |
| GET | /todos/:id | Get a todo by ID |
| PATCH | /todos/:id | Update a todo |
| DELETE | /todos/:id | Delete a todo |
