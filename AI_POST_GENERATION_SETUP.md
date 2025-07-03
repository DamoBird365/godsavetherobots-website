# Secure AI Post Generation Setup Guide

## Overview
This system allows you to securely generate blog posts using Google's Gemini AI API directly from your website's admin interface. All sensitive information is stored in environment variables and never exposed in your code repository.

## Security Features
- ✅ API keys stored as environment variables (never in code)
- ✅ Admin authentication with secure token
- ✅ Server-side API calls (keys never exposed to browser)
- ✅ Preview and approval workflow before publishing
- ✅ CORS protection and request validation

## Required Environment Variables

You need to set these environment variables in your Netlify dashboard:

### 1. Google Gemini API Key
- **Variable Name**: `GEMINI_API_KEY`
- **How to Get**: 
  1. Go to [Google AI Studio](https://aistudio.google.com/)
  2. Sign in with your Google account
  3. Click "Get API key" 
  4. Create a new API key
  5. Copy the key (starts with `AIza...`)

### 2. Admin Authentication Token
- **Variable Name**: `ADMIN_TOKEN`
- **How to Set**: Create a strong, random password/token
- **Example**: `admin_secure_token_2024_xyz789!`
- **Note**: This is what you'll use to login to the admin interface

## Setting Environment Variables in Netlify

1. **Go to Netlify Dashboard**
   - Open your [Netlify dashboard](https://app.netlify.com/)
   - Select your `godsavetherobots` site

2. **Navigate to Environment Variables**
   - Go to `Site settings` → `Environment variables`
   - Click `Add a variable`

3. **Add Both Variables**
   ```
   Key: GEMINI_API_KEY
   Value: [Your Gemini API key]
   Scopes: All deploy contexts
   
   Key: ADMIN_TOKEN  
   Value: [Your chosen admin password]
   Scopes: All deploy contexts
   ```

4. **Deploy the Changes**
   - After adding variables, trigger a new deploy
   - Either push a small change to GitHub or use "Trigger deploy" in Netlify

## How to Use the Admin Interface

1. **Access the Admin Panel**
   - Visit: `https://godsavetherobots.netlify.app/admin`

2. **Login**
   - Enter your `ADMIN_TOKEN` value when prompted

3. **Generate a Post**
   - **Content Input**: Paste an article, link, or topic description
   - **Writing Prompt**: Add specific instructions for the AI
   - Click "Generate Post"

4. **Review and Approve**
   - The AI will generate a post with title, description, content, and tags
   - Review the preview carefully
   - Click "Approve & Save Post" if satisfied
   - The post will be added to your articles.json and appear on the site

## Example Workflow

1. **Find Content**: Copy an interesting article or news item about AI/tech
2. **Paste Content**: Put it in the "Content Input" field
3. **Add Instructions**: e.g., "Write a humorous analysis of this news with practical implications for everyday users"
4. **Generate**: Click generate and wait for AI response
5. **Review**: Check the generated title, content, and tags
6. **Approve**: If good, save it; if not, try again with different instructions

## Security Best Practices

- ✅ **Never commit API keys** to your repository
- ✅ **Use strong admin tokens** (mix of letters, numbers, symbols)
- ✅ **Regularly rotate your admin token** (update it in Netlify settings)
- ✅ **Monitor your Google AI usage** in Google Cloud Console
- ✅ **Keep admin URL private** (don't link to it publicly)

## Troubleshooting

### "Unauthorized" Error
- Check that your `ADMIN_TOKEN` environment variable is set correctly
- Make sure you're entering the exact token when logging in

### "GEMINI_API_KEY not configured" Error  
- Verify the API key is set in Netlify environment variables
- Ensure the key is valid and hasn't expired
- Check Google AI Studio for any usage limits

### Generated Content Issues
- Try refining your prompt with more specific instructions
- Include example tone or style preferences
- Break complex topics into smaller, focused requests

## Cost Management

- Google Gemini has a generous free tier
- Monitor usage in [Google AI Studio](https://aistudio.google.com/)
- Set up billing alerts if you exceed free limits
- Each post generation costs approximately $0.01-0.05

## Next Steps

After setting up:
1. Test the admin interface with a simple post
2. Experiment with different prompt styles  
3. Consider adding more AI models or features
4. Set up monitoring for API usage and costs

## Support

If you encounter issues:
1. Check Netlify function logs: `netlify logs:function generate-post`
2. Verify environment variables are set correctly
3. Test API key independently in Google AI Studio
4. Review browser console for client-side errors
