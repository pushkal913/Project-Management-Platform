# 🚀 Hybrid Deployment Guide

## Architecture Overview
- **Backend**: Render (Node.js API + MongoDB)
- **Frontend**: Vercel (React SPA with perfect routing)

---

## 🔧 Backend Setup (Render)

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

✅ **Backend URL**: `https://project-management-api.onrender.com`

---

## ⚡ Frontend Setup (Vercel)

### Step 1: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import GitHub repository: `pushkal913/Project-Management-Platform`
4. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: `Create React App` (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)

### Step 2: Environment Variables
Add in Vercel Project Settings:
- **Key**: `REACT_APP_API_URL`
- **Value**: `https://project-management-api.onrender.com/api`
- **Environment**: All (Production, Preview, Development)

✅ **Frontend URL**: `https://your-project-name.vercel.app`

---

## 🔄 Auto-Deployment
- ✅ **Render**: Auto-deploys backend on every push to `main`
- ✅ **Vercel**: Auto-deploys frontend on every push to `main`
- ✅ **CORS**: Configured to accept Vercel domains

---

## 🎯 Benefits of This Setup
- ✅ **Perfect SPA Routing**: Vercel handles React routing flawlessly
- ✅ **No Reload Issues**: F5/Ctrl+R works on all pages
- ✅ **Fast CDN**: Global edge caching for frontend
- ✅ **Stable Backend**: Render for reliable API hosting
- ✅ **Free Tier**: Both platforms offer generous free tiers

---

## 📱 Live URLs
- **Frontend**: Will be provided after Vercel deployment
- **Backend API**: `https://project-management-api.onrender.com/api`
- **Admin Panel**: Access via frontend login
