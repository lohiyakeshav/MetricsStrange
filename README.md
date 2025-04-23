Follow these steps to run the project:

# Step 1: Install the necessary dependencies.
```bash
npm i
```

# Step 2: Configure environment variables
Copy the `.env.example` file to create a new `.env` file:
```bash
cp .env.example .env
```

Edit the `.env` file to configure your environment:
- `VITE_API_URL`: The base URL for the API server
  - For local development: `http://localhost:8000`
  - For production: `host your own server`

# Step 3: Start the development server with auto-reloading and an instant preview.
```bash
npm run dev
```

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and modify as needed:

- `VITE_API_URL`: The base URL for the API server
- `NODE_ENV`: Set to `production` for production builds or `development` for local development
- `GITHUB_TOKEN`: (Optional) GitHub API token for higher rate limits
