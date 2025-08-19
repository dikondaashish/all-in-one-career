# 🚀 Render Deployment Guide - All-in-One Career API

## ✅ **Fixed Issues**

- **Port Binding**: Server now properly listens on `process.env.PORT` for Render
- **Package Scripts**: Updated for production builds (`npm run build` + `npm start`)
- **Server Configuration**: Enhanced with Render-specific optimizations
- **Graceful Shutdown**: Added proper signal handling for Render
- **Module System**: Fixed ES Module → CommonJS conversion for Node.js compatibility

## 🔧 **Required Render Settings**

### **Build Command**
```bash
npm install && npm run build
```

### **Start Command**
```bash
npm start
```

### **Environment Variables**
```
NODE_ENV=production
PORT=10000 (Render will set this automatically)
ADMIN_SECRET=climbly_admin_secret_2024
DATABASE_URL=your_neon_db_url
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
GOOGLE_AI_API_KEY=your_gemini_api_key
```

## 📋 **Deployment Steps**

1. **Connect Repository**: Link your GitHub repo to Render
2. **Create Web Service**: Choose "Web Service" type
3. **Configure Build**: Use the build command above
4. **Configure Start**: Use the start command above
5. **Set Environment Variables**: Add all required env vars
6. **Deploy**: Click "Deploy" and monitor the logs

## 🔍 **Expected Logs on Successful Deployment**

```
🚀 API server started successfully
📍 Listening on port 10000
🌐 Environment: production
🔗 Server URL: http://localhost:10000
🎯 Running on Render platform
```

## 🧪 **Test Endpoints After Deployment**

### **Health Check**
```bash
GET https://your-render-app.onrender.com/health
```

### **Admin Announce (Test Phase 2)**
```bash
POST https://your-render-app.onrender.com/api/notifications/announce
Headers: x-admin-secret: climbly_admin_secret_2024
Body: {
  "type": "SYSTEM",
  "title": "Test",
  "message": "Test announcement"
}
```

## 🚨 **Troubleshooting**

### **If you see "Cannot find module '/app/apps/api/dist/index.js'":**
- ✅ **FIXED**: TypeScript now compiles to CommonJS (`dist/index.js`)
- ✅ **FIXED**: Package scripts use correct output directory
- ✅ **FIXED**: Module system compatibility resolved

### **If you see "No open ports detected":**
- ✅ **FIXED**: Server now properly binds to `0.0.0.0:PORT`
- ✅ **FIXED**: Package scripts use compiled JavaScript (`dist/index.js`)

### **If you see "ELIFECYCLE exit code 143":**
- ✅ **FIXED**: Added graceful shutdown handling
- ✅ **FIXED**: Proper signal handling for SIGTERM/SIGINT

### **If build fails:**
- Ensure `npm run build` completes successfully
- Check TypeScript compilation errors
- Verify all dependencies are in `package.json`

## 📁 **File Structure After Build**

```
apps/api/
├── src/           # TypeScript source
├── dist/          # Compiled JavaScript (created by build)
│   ├── index.js   # Main server file (CommonJS)
│   ├── lib/       # Compiled library files
│   ├── routes/    # Compiled route files
│   └── middleware/# Compiled middleware files
├── package.json   # Updated scripts
└── node_modules/  # Dependencies
```

## 🎯 **Key Changes Made**

1. **`package.json`**: Updated scripts for production, removed ES module config
2. **`tsconfig.json`**: Changed module system to CommonJS
3. **`src/index.ts`**: Converted ES imports to CommonJS require statements
4. **Server Config**: Enhanced with Render-specific optimizations
5. **Port Binding**: Now binds to `0.0.0.0:PORT`
6. **Logging**: Added Render-specific logging
7. **Graceful Shutdown**: Proper signal handling

## 🔄 **Deployment Workflow**

1. **Local Build Test**: `npm run build` ✅
2. **Verify Output**: Check `dist/index.js` exists ✅
3. **Push to GitHub**: `git push origin feature/global-search` ✅
4. **Render Auto-Deploy**: Triggers on push ✅
5. **Monitor Logs**: Check for success messages ✅
6. **Test Endpoints**: Verify API is responding ✅

## 🧪 **Local Testing**

### **Test Build Process**
```bash
cd apps/api
npm run build
ls -la dist/  # Should show index.js and other compiled files
```

### **Test Start Script**
```bash
npm start  # Should run dist/index.js successfully
```

---

**Status**: ✅ **READY FOR RENDER DEPLOYMENT - COMMONJS BUILD FIXED**
