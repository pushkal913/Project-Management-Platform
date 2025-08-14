# Deploy to Vercel - One Click Setup

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pushkal913/Project-Management-Platform)

## 🚀 Super Fast Deployment Method

### Method 1: Vercel (Recommended - Fastest & Easiest)

1. **Click the Deploy button above** or go to [vercel.com](https://vercel.com)
2. **Connect your GitHub account** and import this repository
3. **Add environment variables** in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Any secure random string
4. **Deploy!** - Your app will be live in under 2 minutes

### Method 2: Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select this repository
4. Add environment variables
5. Deploy!

### Method 3: Render (Free tier available)

1. Go to [render.com](https://render.com)
2. Connect GitHub and select this repository
3. Create a Web Service
4. Add environment variables
5. Deploy!

## 📝 Environment Variables Needed

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secure-random-string-here
PORT=5000
```

## 🔄 How Changes Work

Once deployed:
1. **Make changes** in VS Code (remote repository)
2. **Commit and push** changes to GitHub
3. **Auto-deployment** happens instantly (usually 1-2 minutes)
4. **View changes** on your live URL

## ✅ Benefits

- ✅ **Zero server management**
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**
- ✅ **Instant deployments**
- ✅ **Free tier available**
- ✅ **Custom domains supported**
