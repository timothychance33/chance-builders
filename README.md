# Chance Builders — Deployment Guide

## Deploy to Vercel

### Option A — Vercel CLI (fastest)
1. Install Node.js from nodejs.org if you don't have it
2. Open a terminal/command prompt in this folder
3. Run: `npm install`
4. Run: `npm install -g vercel`
5. Run: `vercel`
6. Follow the prompts — accept all defaults
7. When asked about environment variables, add:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_KEY

### Option B — Vercel Dashboard (no terminal needed)
1. Go to github.com and create a new repository called "chance-builders"
2. Upload all these files to that repo
3. Go to vercel.com → New Project → Import from GitHub
4. Select your repo
5. Under Environment Variables, add:
   - Name: REACT_APP_SUPABASE_URL  Value: https://hkvlvbalojjirzlojvfi.supabase.co
   - Name: REACT_APP_SUPABASE_KEY  Value: (your publishable key)
6. Click Deploy

### After deploy
- Vercel gives you a URL like: https://chance-builders.vercel.app
- Open it on your phone — add to home screen for app-like experience
- Data saves to Supabase automatically

## Supabase Tables Required
Run the SQL from the conversation in your Supabase SQL Editor before first use.

## Project Structure
```
ChanceBuilders/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx        ← Main app
│   ├── supabase.js    ← Database connection
│   └── index.js       ← Entry point
├── .env               ← Your credentials (never commit this to GitHub)
├── package.json
└── README.md
```

## IMPORTANT — .env and GitHub
Never upload your .env file to GitHub. It contains your API keys.
Vercel handles credentials through their Environment Variables settings instead.
