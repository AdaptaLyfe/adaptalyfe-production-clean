# Deployment Testing & Verification Guide

## 1. Test All Deployment URLs

### Test Each URL Manually:
1. **Railway**: [Your Railway URL] - Primary production hosting
2. **Firebase**: https://adaptalyfe-5a1d3.web.app - Frontend with Railway backend
3. **Custom Domain**: https://app.adaptalyfeapp.com - Frontend with Railway backend  
4. **Replit**: [Your Replit URL] - Development environment

### Expected Result:
- All URLs should load the application interface
- Firebase and custom domain should route API calls to Railway backend
- Login, features, and payments should work on all URLs

## 2. Firebase → Railway Communication Test

### Test Sequence:
1. Open Firebase URL: https://adaptalyfe-5a1d3.web.app
2. Open browser developer tools (F12)
3. Try to log in or register
4. Check Network tab for API calls
5. Verify API calls go to Railway backend (not local)

### Expected Network Calls:
- Login: POST to Railway backend `/api/auth/login`
- Registration: POST to Railway backend `/api/auth/register`
- Data loading: GET requests to Railway backend APIs

## 3. Core Functionality Testing

### Authentication Test:
- [ ] Register new user works on all URLs
- [ ] Login works on all URLs
- [ ] Session persists across page refresh
- [ ] Logout works properly

### Feature Testing:
- [ ] Task management works (create, edit, complete)
- [ ] Mood tracking saves properly
- [ ] Sleep tracking functions correctly
- [ ] Payment system processes correctly
- [ ] AI chatbot responds

### Cross-Deployment Data Consistency:
- [ ] Create a task on Firebase URL
- [ ] Check that same task appears on Railway URL
- [ ] Verify data syncs across all deployments

## 4. Performance Testing

### Load Time Check:
- [ ] Initial page load <3 seconds on all URLs
- [ ] API responses <500ms
- [ ] No console errors in browser

### Mobile Testing:
- [ ] Responsive design works on mobile
- [ ] Touch interactions function properly
- [ ] All features accessible on mobile

## 5. Payment System Verification

### Stripe Integration Test:
- [ ] View Plans page loads correctly
- [ ] Payment form displays properly
- [ ] Test payment processing (use Stripe test mode)
- [ ] Subscription restrictions enforce properly

## 6. Database Connectivity Check

### Verify Shared Database:
- [ ] User data appears consistently across all URLs
- [ ] New data created on one URL appears on others
- [ ] Database connection stable across deployments

## 7. Error Monitoring

### Check for Issues:
- [ ] No JavaScript errors in browser console
- [ ] No failed API requests
- [ ] Proper error handling for network issues
- [ ] Graceful fallbacks when services unavailable

## Quick Test Commands

### API Health Checks:
```bash
# Test Railway API directly
curl https://[your-railway-url]/api/health

# Test Firebase frontend → Railway backend
curl https://adaptalyfe-5a1d3.web.app/api/health

# Test custom domain → Railway backend  
curl https://app.adaptalyfeapp.com/api/health
```

### Expected Response:
All should return 200 OK status codes and health check data.

## Troubleshooting Common Issues

### If Firebase/Custom Domain Can't Reach Railway:
1. Check CORS configuration in Railway
2. Verify environment variables are set correctly
3. Ensure Railway deployment is running

### If Database Issues:
1. Verify DATABASE_URL is correct in Railway
2. Check database connection from Railway logs
3. Ensure database allows connections from Railway IPs

### If Payment Issues:
1. Verify Stripe keys are production keys
2. Check Stripe webhook configuration
3. Test with Stripe test mode first

This comprehensive testing ensures all deployments work together seamlessly with Railway as the backend service.