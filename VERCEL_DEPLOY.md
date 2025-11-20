# Vercel Deployment Guide for ClubCentral

This guide will help you deploy ClubCentral to Vercel and ensure it works 100%.

## Prerequisites

1.  **GitHub Repository:** Ensure your code is pushed to GitHub.
2.  **Neon Database:** You need a PostgreSQL database (e.g., from Neon.tech).
3.  **Vercel Account:** Sign up at [vercel.com](https://vercel.com).

## Step 1: Project Configuration

Ensure your project has the following files configured (I have already done this for you, but it's good to verify):

1.  **`vercel.json`**: Handles routing.
2.  **`api/index.ts`**: The serverless entry point.
3.  **`server/db.ts`**: Database connection (must NOT use WebSockets).

## Step 2: Deploy to Vercel

1.  **Log in to Vercel** and click **"Add New..."** -> **"Project"**.
2.  **Import** your `ClubCentral` repository.
3.  **Configure Project:**
    *   **Framework Preset:** Select **Vite**.
    *   **Root Directory:** Leave as `./` (default).
    *   **Build Command:** `npm run build` (default).
    *   **Output Directory:** `dist/public` (IMPORTANT: You MUST change this from `dist` to `dist/public`).
    *   **Install Command:** `npm install` (default).

## Step 3: Environment Variables (CRITICAL)

You must add the following environment variables in the Vercel dashboard under **Settings** -> **Environment Variables**:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://...` | Your Neon database connection string (pooled). |
| `SESSION_SECRET` | `any-random-string` | A secret key for signing tokens (e.g., `my-super-secret-key-123`). |
| `NODE_ENV` | `production` | Set to production mode. |

**Important:** After adding these variables, you must **Redeploy** for them to take effect. Go to the **Deployments** tab, click the three dots on the latest deployment, and select **Redeploy**.

## Step 4: Verify Database Connection

Vercel functions are "serverless", meaning they shut down when not in use.
*   We removed the WebSocket (`ws`) dependency from `server/db.ts` to ensure compatibility.
*   Ensure your Neon database is active.

## Troubleshooting Login Issues

If login fails on Vercel but works on Render:

1.  **Check Vercel Logs:**
    *   Go to your Vercel Dashboard -> Project -> **Logs**.
    *   Filter by "Functions".
    *   Look for errors when you try to login.
    *   Common errors:
        *   `FUNCTION_INVOCATION_FAILED`: Usually means a crash (DB connection or missing env var).
        *   `504 Gateway Timeout`: Database is too slow to respond.

2.  **Check Network Tab:**
    *   Open your browser's Developer Tools (F12).
    *   Go to the **Network** tab.
    *   Try to login.
    *   Click on the `login` request (it will be red if it fails).
    *   Check the **Response** tab to see the error message from the server.

3.  **Database Location:**
    *   Ensure your Neon database is in a region close to your Vercel function (e.g., both in US East or Europe). Cross-region latency can cause timeouts.

## Common Fixes

*   **"Function Invocation Failed"**: Double-check `DATABASE_URL` is correct and contains the password.
*   **"Invalid Credentials"**: If you manually inserted data, ensure passwords are hashed using `bcrypt`.
*   **White Screen / 404**: Ensure **Output Directory** is set to `dist/public`.
