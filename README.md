# Pastebin-Lite

A simple pastebin application built with Next.js 14 and Vercel KV (Redis), allowing users to create and share text pastes with optional time-to-live (TTL) and view count limits.

## Features

- Create text pastes with optional expiry constraints
- Share pastes via unique URLs
- Optional TTL (time-to-live) for automatic expiry
- Optional view count limits
- Automatic paste deletion when constraints are met
- Clean, responsive UI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Persistence**: Vercel KV (Redis)
- **Deployment**: Vercel

## Persistence Layer

This application uses **Vercel KV** (a Redis-compatible key-value store) for data persistence. Vercel KV is ideal for serverless deployments as it:

- Survives across serverless function invocations
- Provides automatic TTL support for time-based expiry
- Offers low-latency global access
- Requires no manual database setup or migrations

## Running Locally

### Prerequisites

- Node.js 18+ installed
- Vercel account (for KV database)
- Vercel CLI installed (`npm i -g vercel`)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pastebin-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Vercel KV**
   ```bash
   # Login to Vercel
   vercel login

   # Link your project to Vercel
   vercel link

   # Pull environment variables (includes KV credentials)
   vercel env pull .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your repository

3. **Add Vercel KV**
   - In your project dashboard, go to "Storage"
   - Click "Create Database"
   - Select "KV"
   - Follow the prompts

4. **Deploy**
   ```bash
   vercel --prod
   ```

Or simply push to your main branch if connected to Vercel.

## API Endpoints

### Health Check
```
GET /api/healthz
```
Returns service health status and KV connectivity.

### Create Paste
```
POST /api/pastes
Content-Type: application/json

{
  "content": "Your text here",
  "ttl_seconds": 3600,    // Optional
  "max_views": 5          // Optional
}
```

### Fetch Paste (API)
```
GET /api/pastes/:id
```
Returns paste content and metadata. Increments view count.

### View Paste (HTML)
```
GET /p/:id
```
Renders paste content as HTML page.

## Design Decisions

### 1. **Vercel KV for Persistence**
   - Chose Redis-compatible KV store for serverless compatibility
   - Native TTL support eliminates need for background cleanup jobs
   - Atomic operations ensure view count accuracy

### 2. **View Count Management**
   - View count increments on both API fetch and HTML page view
   - Paste is deleted immediately when view limit is reached
   - Uses optimistic locking to prevent race conditions

### 3. **TTL Handling**
   - Leverages Redis native TTL for automatic expiry
   - Additional application-level checks for test mode support
   - Recalculates remaining TTL when updating view counts

### 4. **Test Mode**
   - Supports `TEST_MODE=1` environment variable
   - Accepts `x-test-now-ms` header for deterministic time testing
   - Allows automated testing of time-based expiry

### 5. **Error Handling**
   - All unavailable pastes return 404 (expired, view limit exceeded, or not found)
   - Consistent JSON error responses for API endpoints
   - Input validation with clear error messages

### 6. **Security**
   - Content is rendered safely using `<pre>` tags (no script execution)
   - Input sanitization on paste creation
   - No sensitive data in URLs

## Testing

The application is designed to pass automated tests that verify:

- Health check endpoint functionality
- Paste creation and retrieval
- TTL expiry behavior
- View count limits
- Combined constraints
- Error handling

To enable test mode for deterministic time testing:
```bash
TEST_MODE=1 npm run dev
```

## License

MIT