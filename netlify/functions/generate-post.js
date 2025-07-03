const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check for admin token (simple auth mechanism)
    const authHeader = event.headers.authorization;
    const adminToken = process.env.ADMIN_TOKEN;
    

    
    if (!adminToken) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'ADMIN_TOKEN environment variable not configured in Netlify' })
      };
    }
    
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header missing' })
      };
    }
    
    if (authHeader !== `Bearer ${adminToken}`) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid admin token' })
      };
    }

    // Parse request body
    const { prompt, contentInput, action } = JSON.parse(event.body);

    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini API key configured:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GEMINI_API_KEY environment variable not configured in Netlify' })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    if (action === 'generate') {
      // Generate new post content
      const fullPrompt = `
You are "The Digital Prophet" - a tech-optimistic, creative, and slightly quirky writer for "God Save the Robots" with the tagline "Our robots, who art in servers."

Analyze the provided YouTube video content and create an engaging article about the business value of the main technology discussed.

Content Input: ${contentInput}

${prompt}

Return the response in this exact JSON format matching our articles.json structure:
{
  "title": "Your Generated Title",
  "slug": "auto-generated-slug",
  "description": "Meta description for SEO (max 160 characters)",
  "content": "Full markdown content with proper headings, bullet points, and engaging sections",
  "type": "article",
  "author": "The Digital Prophet",
  "tags": ["AI", "automation", "technology", "business-value"],
  "featured": false,
  "status": "published",
  "readTime": 5,
  "publishDate": "${new Date().toISOString()}"
}
`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse as JSON, fallback to plain text
      let generatedContent;
      try {
        generatedContent = JSON.parse(text);
      } catch (e) {
        // If not valid JSON, structure the response
        generatedContent = {
          title: "Generated Post",
          description: "AI generated content",
          content: text,
          tags: "ai, generated",
          author: "The Divine Algorithm"
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          generatedContent
        })
      };

    } else if (action === 'save') {
      // Save the approved content via GitHub API (since Netlify Functions are read-only)
      const { articleData } = JSON.parse(event.body);
      
      // GitHub repository details
      const owner = 'DamoBird365'; // Update with your GitHub username
      const repo = 'godsavetherobots-website';
      const branch = 'main';
      const filePath = 'content/articles.json';
      
      // GitHub API token from environment
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'GITHUB_TOKEN environment variable not configured. Please set up a GitHub Personal Access Token.' })
        };
      }

      try {
        // First, get the current file content and SHA
        const getFileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!getFileResponse.ok) {
          throw new Error(`Failed to fetch current articles.json: ${getFileResponse.statusText}`);
        }

        const fileData = await getFileResponse.json();
        const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');
        const articles = JSON.parse(currentContent);

        // Create new article object with proper structure
        const newArticle = {
          id: `article-${Date.now()}`,
          title: articleData.title,
          slug: articleData.slug || articleData.title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          description: articleData.description,
          content: articleData.content,
          type: articleData.type || "article",
          publishDate: articleData.publishDate || new Date().toISOString(),
          author: articleData.author || "The Digital Prophet",
          tags: Array.isArray(articleData.tags) ? articleData.tags : articleData.tags.split(',').map(tag => tag.trim()),
          featured: articleData.featured || false,
          status: articleData.status || "published",
          readTime: articleData.readTime || 5
        };

        // Add to articles array
        articles.unshift(newArticle); // Add to beginning

        // Prepare updated content
        const updatedContent = JSON.stringify(articles, null, 2);
        const encodedContent = Buffer.from(updatedContent).toString('base64');

        // Update the file via GitHub API
        const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Add new article: ${newArticle.title}`,
            content: encodedContent,
            sha: fileData.sha,
            branch: branch
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(`Failed to update articles.json: ${updateResponse.statusText} - ${JSON.stringify(errorData)}`);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Article saved successfully to GitHub! The site will rebuild automatically.',
            article: newArticle
          })
        };

      } catch (error) {
        console.error('GitHub API Error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to save article',
            details: error.message,
            note: 'This requires a GITHUB_TOKEN environment variable with repo access.'
          })
        };
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
