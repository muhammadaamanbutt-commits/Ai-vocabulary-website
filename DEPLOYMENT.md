# AI Vocabulary Website - Deployment Guide

This guide covers deploying your AI-powered vocabulary exploration app to Vercel with GitHub integration, including environment setup and troubleshooting.

## 📋 Prerequisites

Before deploying, ensure you have:

- GitHub account
- Vercel account (free tier works great)
- Groq API key (required) - [Get one here](https://console.groq.com/keys)
- Hugging Face API key (optional, recommended) - [Get one here](https://huggingface.co/settings/tokens)

---

## 🚀 Part 1: GitHub Setup

### 1. Create a GitHub Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AI Vocabulary Website"

# Create a new repository on GitHub (via web interface)
# Then connect your local repo:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Verify Repository Structure

Your repository should have this structure:

```
ai-vocabulary-website/
├── client/                 # Frontend (Vite + React)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── server/                 # Backend serverless functions
│   └── api/
│       ├── words.js        # Main API endpoint
│       ├── package.json
│       └── .env.example
├── vercel.json            # Vercel configuration
└── DEPLOYMENT.md          # This file
```

---

## 🔧 Part 2: Vercel Deployment

### Step 1: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`

### Step 2: Configure Build Settings

Vercel should automatically detect these settings (verify them):

- **Framework Preset:** Other
- **Build Command:** `cd client && npm install && npm run build`
- **Output Directory:** `client/dist`
- **Install Command:** `npm install` (root level)

### Step 3: Configure Environment Variables

In the Vercel dashboard, go to **Settings** → **Environment Variables** and add:

#### Required Variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com | Production, Preview, Development |

#### Optional but Recommended:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `HUGGINGFACE_API_KEY` | Your Hugging Face token | Production, Preview, Development |

**Important Notes:**
- Select all three environments (Production, Preview, Development) for each variable
- Do NOT set `KV_REST_API_URL` or `KV_REST_API_TOKEN` manually - these are auto-configured when you enable KV storage

### Step 4: Enable Vercel KV Storage (Caching)

Vercel KV provides Redis-compatible storage for caching AI-generated definitions:

1. In your project dashboard, go to **Storage** tab
2. Click **Create Database** → Select **KV**
3. Choose a name like `vocab-cache`
4. Select your region (choose closest to your users)
5. Click **Create**
6. Vercel automatically injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` into your project

**Benefits of KV caching:**
- Reduces AI API calls by caching results for 30 days
- Significantly faster response times for repeated searches
- Saves API quota and costs

### Step 5: Deploy

1. Click **Deploy**
2. Vercel will:
   - Install dependencies for both client and server
   - Build the frontend (Vite)
   - Deploy serverless functions
   - Set up routing automatically
3. Wait 2-3 minutes for deployment to complete

### Step 6: Verify Deployment

Once deployed, you'll get a URL like `https://your-project.vercel.app`

Test your deployment:

1. **Homepage:** Visit `https://your-project.vercel.app`
   - Should show the vocabulary search interface
   
2. **API Endpoint:** Test directly
   ```bash
   curl "https://your-project.vercel.app/api/words?term=algorithm"
   ```
   - Should return JSON with definition, related words, and field definitions

---

## 🧪 Part 3: Testing the Deployment

### Manual Testing Checklist

- [ ] Homepage loads correctly
- [ ] Search for a word (e.g., "algorithm")
- [ ] Definition appears with 20-35 words
- [ ] 20 related words are displayed
- [ ] Field-specific definitions show up
- [ ] Click on a related word to navigate
- [ ] Check browser console for errors
- [ ] Test on mobile device

### API Testing

```bash
# Test basic request
curl "https://your-project.vercel.app/api/words?term=database"

# Test with fresh data (bypass cache)
curl "https://your-project.vercel.app/api/words?term=database&fresh=true"

# Expected response format:
{
  "definition": "...",
  "related_words": ["word1", "word2", ...],
  "field_definitions": [
    {
      "field": "Computer Science",
      "definition": "..."
    }
  ],
  "is_ai_generated": true,
  "provider_used": "Groq (70B)",
  "cached": false,
  "generated_at": "2026-07-24T16:00:00.000Z"
}
```

---

## 🔍 Part 4: Monitoring & Logs

### View Deployment Logs

1. Go to your Vercel project dashboard
2. Click on the deployment
3. Navigate to **Runtime Logs** to see:
   - AI provider requests
   - Cache hits/misses
   - API errors
   - Response times

### Common Log Messages

✅ **Success logs:**
```
✅ Cache hit for term: "algorithm"
✅ Success with Groq (70B)
✅ Cached data for term: "algorithm"
```

⚠️ **Warning logs:**
```
⚠️  Vercel KV not available (running locally or KV not configured)
⏳ Rate limit hit on Groq (70B), trying next provider...
```

❌ **Error logs:**
```
❌ Groq (70B) failed: rate_limit_exceeded
❌ All AI providers failed
```

---

## 🛠️ Part 5: Troubleshooting

### Issue 1: "All AI providers failed"

**Symptoms:** API returns 500 error with message about all providers failing

**Solutions:**
1. Verify `GROQ_API_KEY` is set correctly in Vercel dashboard
2. Check API key is valid at [console.groq.com](https://console.groq.com)
3. Add `HUGGINGFACE_API_KEY` as fallback
4. Check Groq API status: [status.groq.com](https://status.groq.com)
5. View runtime logs for specific error messages

### Issue 2: Rate Limit Exceeded

**Symptoms:** Frequent "rate_limit" errors in logs

**Solutions:**
1. Verify Vercel KV is enabled (provides automatic caching)
2. Add `HUGGINGFACE_API_KEY` as fallback provider
3. The system automatically falls back to:
   - Groq 8B model (higher rate limits)
   - Hugging Face (if key provided)

### Issue 3: KV Cache Not Working

**Symptoms:** Every request generates fresh data, no "Cache hit" logs

**Solutions:**
1. Verify KV database is created in Vercel dashboard (Storage tab)
2. Check KV database is connected to your project
3. Redeploy after enabling KV (may require redeployment)
4. Check runtime logs for "KV not available" warnings

### Issue 4: CORS Errors

**Symptoms:** Browser shows CORS errors when accessing API

**Solutions:**
- CORS is already configured in `server/api/words.js`
- If issues persist, check Vercel logs for specific error
- Ensure you're accessing via the correct domain (not mixing http/https)

### Issue 5: Build Failures

**Symptoms:** Deployment fails during build step

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify `vercel.json` has correct paths
3. Ensure both `client/package.json` and `server/api/package.json` exist
4. Try building locally first:
   ```bash
   cd client
   npm install
   npm run build
   ```

### Issue 6: Environment Variables Not Loading

**Symptoms:** Runtime logs show "no API key" or "Skipping provider"

**Solutions:**
1. Go to Vercel dashboard → Settings → Environment Variables
2. Verify variables are set for **Production** environment
3. Redeploy after adding/updating variables
4. Check variable names match exactly (case-sensitive):
   - `GROQ_API_KEY`
   - `HUGGINGFACE_API_KEY`

### Issue 7: Function Timeout

**Symptoms:** API requests timeout after 10 seconds

**Solutions:**
1. Hugging Face models may take time to load (first request)
2. The system has 90-second timeout configured
3. For free tier Vercel, functions timeout at 10s - consider upgrading for longer timeouts
4. Enable KV caching to avoid repeated AI calls

---

## 🔄 Part 6: Updating Your Deployment

### Method 1: Automatic (Recommended)

Every push to your `main` branch automatically triggers a new deployment:

```bash
# Make changes to your code
git add .
git commit -m "Description of changes"
git push origin main

# Vercel automatically deploys the changes
```

### Method 2: Manual Redeploy

From Vercel dashboard:
1. Go to Deployments tab
2. Click **⋯** (three dots) on latest deployment
3. Select **Redeploy**

---

## 📊 Part 7: Performance Optimization

### Caching Strategy

The app uses a 30-day cache for generated vocabulary data:

- **First request:** Calls AI provider, caches result
- **Subsequent requests:** Returns cached data instantly
- **Cache key:** `vocab:{term}` (case-insensitive)
- **Bypass cache:** Add `?fresh=true` to API URL

### Cost Optimization

**Free tier limits:**
- **Groq:** Very generous free tier, rate-limited
- **Hugging Face:** Free inference API, may have cold starts
- **Vercel KV:** 256MB storage, 100k requests/month on free tier
- **Vercel Functions:** 100GB-hours/month, 100k invocations

**Tips to stay within free tier:**
1. Enable KV caching (reduces AI API calls by ~90%)
2. Use both Groq and Hugging Face for redundancy
3. Monitor usage in Vercel dashboard
4. Consider upgrading if you exceed limits

---

## 🔐 Part 8: Security Best Practices

### API Keys

- ✅ Store in Vercel environment variables (encrypted)
- ✅ Never commit `.env` files to git
- ✅ Rotate keys periodically
- ❌ Never expose keys in client-side code
- ❌ Never hardcode keys in source files

### CORS Configuration

Current setup allows all origins (`*`). For production with known domains:

Edit `server/api/words.js:436`:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
```

---

## 📞 Support & Resources

### Official Documentation

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel KV:** [vercel.com/docs/storage/vercel-kv](https://vercel.com/docs/storage/vercel-kv)
- **Groq API:** [console.groq.com/docs](https://console.groq.com/docs)
- **Hugging Face Inference:** [huggingface.co/docs/api-inference](https://huggingface.co/docs/api-inference)

### Common Commands

```bash
# Install Vercel CLI (optional, for local testing)
npm install -g vercel

# Test locally with Vercel environment
vercel dev

# Deploy from CLI
vercel --prod

# View logs
vercel logs

# Check environment variables
vercel env ls
```

---

## ✅ Deployment Complete!

Your AI Vocabulary Website is now live. Users can:

- Search for any word or concept
- Get comprehensive AI-generated definitions (20-35 words)
- Explore 20 related words per term
- View field-specific definitions
- Navigate through an interconnected graph of vocabulary

**Next Steps:**

1. Share your deployment URL
2. Monitor usage and API quotas
3. Consider custom domain setup (Vercel Settings → Domains)
4. Enable analytics (Vercel Analytics or Google Analytics)
5. Gather user feedback and iterate

---

**Questions or issues?** Check the troubleshooting section or review Vercel runtime logs for detailed error messages.
