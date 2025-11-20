# Deployment Guide for ClubCentral

This guide will help you deploy your ClubCentral application for free using Render.com and Neon.tech (for the database).

## Prerequisites

1.  A GitHub account with this repository uploaded.
2.  A [Render.com](https://render.com/) account.
3.  A [Neon.tech](https://neon.tech/) account (recommended for free PostgreSQL).

## Step 1: Set up the Database (Neon)

1.  Log in to [Neon.tech](https://neon.tech/).
2.  Create a new project.
3.  Copy the **Connection String** (it looks like `postgres://user:password@...`).
    *   Make sure to select "Pooled connection" if available, or just the standard one.

## Step 2: Deploy to Render

1.  Log in to [Render.com](https://render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Render will detect the `render.yaml` file in your repository.
5.  It will ask you to approve the configuration.
6.  **Important:** You will see a prompt to input environment variables.
    *   **DATABASE_URL**: Paste the connection string you copied from Neon.
    *   **SESSION_SECRET**: Render will generate this automatically (or you can type a random string).
7.  Click **Apply** or **Create Web Service**.

## Step 3: Verify Deployment

1.  Render will start building your app. This might take a few minutes.
2.  Watch the logs. You should see "Build successful" and then "Server started".
3.  Once deployed, click the URL provided by Render (e.g., `https://club-central.onrender.com`) to open your app.

## Troubleshooting

*   **Database Errors:** If the app fails to start, check the Logs tab in Render. If you see database connection errors, verify your `DATABASE_URL` is correct.
*   **Build Errors:** Ensure your `package.json` scripts are correct (we verified them, so they should be fine).

## Option 2: Deploy to Vercel

1.  Install the Vercel CLI: `npm i -g vercel` (or use the web dashboard).
2.  Run `vercel` in your project folder.
3.  Follow the prompts.
4.  **Important:** Add your `DATABASE_URL` and `SESSION_SECRET` in the Vercel Project Settings > Environment Variables.
5.  Redeploy if needed.
