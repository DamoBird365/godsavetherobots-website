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
    
    if (!authHeader || !adminToken || authHeader !== `Bearer ${adminToken}`) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Parse request body
    const { prompt, contentInput, action } = JSON.parse(event.body);

    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    if (action === 'generate') {
      // Generate new post content
      const fullPrompt = `
You are a technical writer for "God Save the Robots" - a blog about AI, automation, and technology's impact on society with a humorous, slightly irreverent tone.

Content Input: ${contentInput}

Prompt: ${prompt}

Please generate a blog post with the following structure:
- Title (engaging and relevant)
- Brief meta description (for SEO)
- Content in markdown format
- Tags (comma-separated)

The tone should be informative but accessible, with occasional humor. Focus on practical implications and human perspectives on technology.

Return the response in this JSON format:
{
  "title": "Your Generated Title",
  "description": "Meta description for SEO",
  "content": "Full markdown content here",
  "tags": "ai, automation, technology",
  "author": "The Divine Algorithm"
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
      // Save the approved content to articles.json
      const { articleData } = JSON.parse(event.body);
      
      // Read current articles
      const articlesPath = path.join(process.cwd(), 'content', 'articles.json');
      let articles = [];
      
      try {
        const articlesContent = await fs.readFile(articlesPath, 'utf8');
        articles = JSON.parse(articlesContent);
      } catch (error) {
        console.log('No existing articles.json found, creating new one');
      }

      // Create new article object
      const newArticle = {
        id: `article-${Date.now()}`,
        title: articleData.title,
        description: articleData.description,
        content: articleData.content,
        author: articleData.author || "The Divine Algorithm",
        date: new Date().toISOString().split('T')[0],
        published: true,
        featured: false,
        tags: articleData.tags.split(',').map(tag => tag.trim()),
        slug: articleData.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      };

      // Add to articles array
      articles.unshift(newArticle); // Add to beginning

      // Save back to file
      await fs.writeFile(articlesPath, JSON.stringify(articles, null, 2));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Article saved successfully',
          article: newArticle
        })
      };
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
