# 🚀 Render Deployment Guide

## Quick Setup for Auto-Deployment

### Step 1: Backend API Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `pushkal913/Project-Management-Platform`
4. Configure:
   - **Name**: `project-management-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: Any secure random string
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (Render will set this automatically)

### Step 2: Frontend Static Site
1. Click "New +" → "Static Site"
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `project-management-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`
   - **Environment Variables**:
     - `REACT_APP_API_URL`: `https://your-api-service-name.onrender.com`

### Step 3: Auto-Deploy Setup ✅
- ✅ Auto-deploy is enabled by default
- ✅ Every time you push to GitHub, Render will automatically deploy
- ✅ Your data is protected with our backup system

## 🔄 Your Workflow (Super Easy!)

1. **I make changes** in VS Code remote repository
2. **You review and push** the changes to GitHub
3. **Render automatically deploys** (takes 2-3 minutes)
4. **Visit your live site** to see the changes!

## 🛡️ Data Safety
- ✅ Seed script is now safe (won't delete existing data)
- ✅ Backup scripts are available (`npm run backup`)
- ✅ Your MongoDB Atlas data is preserved

## 🌐 URLs After Deployment
- **API**: `https://project-management-api.onrender.com`
- **Frontend**: `https://project-management-frontend.onrender.com`

## 🔧 Quick Commands
```bash
# Test locally first (optional)
npm run backup        # Backup your data
npm run dev          # Run locally

# Deploy to production
git add .
git commit -m "Your changes"
git push origin main  # Auto-deploys to Render!
```

## 📞 Need Help?
If you need help with any step, just let me know!
