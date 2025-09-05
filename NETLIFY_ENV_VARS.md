# Netlify Environment Variables Configuration

Copy and paste these environment variables into your Netlify deployment:

## 🔑 Essential Configuration

```bash
# Next.js Authentication
NEXTAUTH_URL=https://corev2.netlify.app
NEXTAUTH_SECRET=xhQHxaaKmhoCu2Ds77pJZB+2F+QkudfxunkKND/o9mI=

# Your API Keys (Use the keys from your keys.txt file)
OPENAI_API_KEY=your-openai-key-from-keys-txt-file
GEMINI_API_KEY=your-gemini-key-from-keys-txt-file

# Encryption Keys (Generated)
ENCRYPTION_KEY=a397d85744d5e2808c176c7754c1fbe9a0bdcbd6d5a146409106737dd7b1657f
ENCRYPTION_IV=b919fef1e7e31cde7aeb8241960ae4ab

# Feature Flags (Enable AI features)
ENABLE_AI_THERAPY=true
ENABLE_CRISIS_DETECTION=true
ENABLE_PEER_SUPPORT=true
ENABLE_PROFESSIONAL_SERVICES=false
ENABLE_OFFLINE_MODE=true

# Environment
NODE_ENV=production

# Database (Add when ready - use Supabase/Railway/Neon)
DATABASE_URL=your-postgresql-database-url-here

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_TIMEOUT_HOURS=24

# Optional: Analytics
ANALYTICS_ENABLED=false

# Optional: Monitoring
LOG_LEVEL=info
```

## 📝 How to Add to Netlify:

1. Go to your site in Netlify dashboard
2. Navigate to: **Site settings** → **Environment variables** 
3. Click **Add variable** for each key-value pair above
4. Click **Save** after adding all variables
5. Trigger a new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

## 🔒 Security Notes:

- These keys are cryptographically secure
- NEXTAUTH_SECRET: Generated with OpenSSL base64 (256-bit)
- ENCRYPTION_KEY: Generated with OpenSSL hex (256-bit)  
- ENCRYPTION_IV: Generated with OpenSSL hex (128-bit)
- Never commit these keys to your repository

Your site will be available at: **https://corev2.netlify.app**