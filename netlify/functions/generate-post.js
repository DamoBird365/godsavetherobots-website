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

IMPORTANT: Respond with ONLY a valid JSON object, no additional text, explanations, or markdown formatting. Do not wrap the response in code blocks or backticks.

Generate a URL-friendly slug from the title by:
1. Converting to lowercase
2. Replacing spaces with hyphens
3. Removing special characters except hyphens
4. Ensuring it's under 50 characters

Required JSON format:
{
  "title": "Your Generated Title",
  "slug": "url-friendly-slug-from-title",
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
      
      // Clean up the response text - remove markdown code blocks if present
      let cleanText = text.trim();
      console.log('Raw AI response length:', text.length);
      console.log('Raw AI response preview:', text.substring(0, 200) + '...');
      
      // Remove various markdown code block formats
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Also try to extract JSON from text if it's wrapped in other text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      console.log('Cleaned text for parsing preview:', cleanText.substring(0, 200) + '...');
      
      // Try to parse as JSON, fallback to plain text
      let generatedContent;
      try {
        generatedContent = JSON.parse(cleanText);
        
        // Validate and ensure all required fields are present with defaults
        generatedContent.title = generatedContent.title || "AI Generated Article";
        
        // Generate proper slug from title
        const generateSlug = (title) => {
          return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .substring(0, 50); // Limit length
        };
        
        generatedContent.slug = generatedContent.slug || generateSlug(generatedContent.title);
        generatedContent.id = generatedContent.id || generatedContent.slug; // Use slug as ID
        generatedContent.description = generatedContent.description || "An AI-generated article about technology and business value.";
        generatedContent.content = generatedContent.content || "# AI Generated Content\n\nContent generation in progress...";
        generatedContent.type = generatedContent.type || "article";
        generatedContent.author = generatedContent.author || "The Digital Prophet";
        generatedContent.featured = generatedContent.featured !== undefined ? generatedContent.featured : false;
        generatedContent.status = generatedContent.status || "published";
        generatedContent.readTime = generatedContent.readTime || 5;
        generatedContent.publishDate = generatedContent.publishDate || new Date().toISOString();
        
        // Ensure tags are an array
        if (typeof generatedContent.tags === 'string') {
          generatedContent.tags = generatedContent.tags.split(',').map(tag => tag.trim());
        } else if (!Array.isArray(generatedContent.tags)) {
          generatedContent.tags = ["ai", "technology"];
        }
        
        console.log('Successfully parsed article:', generatedContent.title);
        
      } catch (e) {
        console.error('JSON parsing failed:', e.message);
        console.log('Failed to parse text (first 500 chars):', cleanText.substring(0, 500));
        
        // If not valid JSON, create a structured fallback with the raw content
        const fallbackSlug = "ai-generated-fallback-" + Date.now();
        generatedContent = {
          id: fallbackSlug,
          title: "AI Generated Article (Format Issue)",
          slug: fallbackSlug,
          description: "An AI generated article - the response format needed adjustment.",
          content: `# AI Generated Content\n\n${text}\n\n---\n\n*Note: The AI response was not in the expected JSON format and has been formatted for display.*`,
          type: "article",
          author: "The Digital Prophet",
          tags: ["ai", "generated", "technology"],
          featured: false,
          status: "published",
          readTime: 5,
          publishDate: new Date().toISOString()
        };
        
        console.log('Using fallback article structure');
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
