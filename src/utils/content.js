const fs = require('fs').promises;
const path = require('path');
const { siteConfig } = require('./seo');
const { processArticleContent } = require('./markdown');

/**
 * Content management utilities for JSON-based articles
 * Designed for easy migration to database systems
 */

class ContentManager {
  constructor() {
    this.articlesPath = path.join(__dirname, '../../content/articles.json');
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Load all articles from JSON file
   * With caching for performance
   */
  async loadArticles() {
    const cacheKey = 'all_articles';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await fs.readFile(this.articlesPath, 'utf8');
      const articles = JSON.parse(data);
      
      // Process articles with computed fields and markdown content
      const processedArticles = articles.map(article => {
        // Process markdown content
        const processedContent = processArticleContent(article);
        
        return {
          ...processedContent,
          publishDate: new Date(article.publishDate),
          lastModified: article.lastModified ? new Date(article.lastModified) : new Date(article.publishDate),
          readTime: article.readTime || this.calculateReadingTime(article.content),
          wordCount: this.estimateWordCount(article.content),
          url: `/articles/${article.slug}`,
          fullUrl: `${siteConfig.site.baseUrl}/articles/${article.slug}`
        };
      });

      // Cache the result
      this.cache.set(cacheKey, {
        data: processedArticles,
        timestamp: Date.now()
      });

      return processedArticles;
    } catch (error) {
      console.error('Error loading articles:', error);
      return [];
    }
  }

  /**
   * Get published articles only
   */
  async getPublishedArticles() {
    const articles = await this.loadArticles();
    return articles.filter(article => article.status === 'published');
  }

  /**
   * Get featured articles
   */
  async getFeaturedArticles(limit = 3) {
    const articles = await this.getPublishedArticles();
    return articles
      .filter(article => article.featured)
      .sort((a, b) => b.publishDate - a.publishDate)
      .slice(0, limit);
  }

  /**
   * Get latest articles
   */
  async getLatestArticles(limit = 10) {
    const articles = await this.getPublishedArticles();
    return articles
      .sort((a, b) => b.publishDate - a.publishDate)
      .slice(0, limit);
  }

  /**
   * Get article by slug
   */
  async getArticleBySlug(slug) {
    const articles = await this.loadArticles();
    return articles.find(article => article.slug === slug && article.status === 'published');
  }

  /**
   * Get article by ID
   */
  async getArticleById(id) {
    const articles = await this.loadArticles();
    return articles.find(article => article.id === id);
  }

  /**
   * Get articles by tag
   */
  async getArticlesByTag(tag, limit = 10) {
    const articles = await this.getPublishedArticles();
    return articles
      .filter(article => article.tags && article.tags.includes(tag))
      .sort((a, b) => b.publishDate - a.publishDate)
      .slice(0, limit);
  }

  /**
   * Get articles by type (article, video, external)
   */
  async getArticlesByType(type, limit = 10) {
    const articles = await this.getPublishedArticles();
    return articles
      .filter(article => article.type === type)
      .sort((a, b) => b.publishDate - a.publishDate)
      .slice(0, limit);
  }

  /**
   * Search articles by title or content
   */
  async searchArticles(query, limit = 10) {
    const articles = await this.getPublishedArticles();
    const searchTerm = query.toLowerCase();
    
    return articles
      .filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.description.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm) ||
        (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
      .sort((a, b) => {
        // Prioritize title matches, then description, then content
        const aScore = this.calculateSearchScore(a, searchTerm);
        const bScore = this.calculateSearchScore(b, searchTerm);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * Get related articles based on tags
   */
  async getRelatedArticles(article, limit = 3) {
    if (!article.tags || article.tags.length === 0) {
      return this.getLatestArticles(limit);
    }

    const articles = await this.getPublishedArticles();
    
    return articles
      .filter(a => a.id !== article.id) // Exclude current article
      .map(a => ({
        ...a,
        relevance: this.calculateRelevance(article, a)
      }))
      .filter(a => a.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Get all unique tags
   */
  async getAllTags() {
    const articles = await this.getPublishedArticles();
    const tagSet = new Set();
    
    articles.forEach(article => {
      if (article.tags) {
        article.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }

  /**
   * Get articles grouped by month/year for archive
   */
  async getArticleArchive() {
    const articles = await this.getPublishedArticles();
    const archive = {};
    
    articles.forEach(article => {
      const date = new Date(article.publishDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!archive[key]) {
        archive[key] = {
          label,
          articles: []
        };
      }
      
      archive[key].articles.push(article);
    });
    
    // Sort by date (newest first)
    const sortedArchive = Object.keys(archive)
      .sort((a, b) => b.localeCompare(a))
      .reduce((result, key) => {
        result[key] = archive[key];
        return result;
      }, {});
    
    return sortedArchive;
  }

  /**
   * Add new article (for future admin interface)
   */
  async addArticle(articleData) {
    const articles = await this.loadArticles();
    
    // Generate ID and slug if not provided
    const newArticle = {
      id: articleData.id || this.generateId(articleData.title),
      slug: articleData.slug || this.generateSlug(articleData.title),
      publishDate: articleData.publishDate || new Date().toISOString(),
      status: articleData.status || 'draft',
      ...articleData
    };
    
    articles.push(newArticle);
    await this.saveArticles(articles);
    this.clearCache();
    
    return newArticle;
  }

  /**
   * Update existing article
   */
  async updateArticle(id, updates) {
    const articles = await this.loadArticles();
    const index = articles.findIndex(article => article.id === id);
    
    if (index === -1) {
      throw new Error(`Article with ID ${id} not found`);
    }
    
    articles[index] = {
      ...articles[index],
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    await this.saveArticles(articles);
    this.clearCache();
    
    return articles[index];
  }

  /**
   * Delete article
   */
  async deleteArticle(id) {
    const articles = await this.loadArticles();
    const filteredArticles = articles.filter(article => article.id !== id);
    
    if (filteredArticles.length === articles.length) {
      throw new Error(`Article with ID ${id} not found`);
    }
    
    await this.saveArticles(filteredArticles);
    this.clearCache();
    
    return true;
  }

  /**
   * Helper methods
   */
  calculateSearchScore(article, searchTerm) {
    let score = 0;
    
    if (article.title.toLowerCase().includes(searchTerm)) score += 3;
    if (article.description.toLowerCase().includes(searchTerm)) score += 2;
    if (article.content.toLowerCase().includes(searchTerm)) score += 1;
    if (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm))) score += 2;
    
    return score;
  }

  calculateRelevance(article1, article2) {
    if (!article1.tags || !article2.tags) return 0;
    
    const commonTags = article1.tags.filter(tag => article2.tags.includes(tag));
    return commonTags.length;
  }

  generateId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  generateSlug(title) {
    return this.generateId(title);
  }

  estimateWordCount(content) {
    if (!content) return 0;
    return content
      .replace(/[#*_`\[\]()]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .split(/\s+/).length;
  }

  calculateReadingTime(content, wordsPerMinute = 200) {
    const wordCount = this.estimateWordCount(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  async saveArticles(articles) {
    const data = JSON.stringify(articles, null, 2);
    await fs.writeFile(this.articlesPath, data, 'utf8');
  }

  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const contentManager = new ContentManager();

module.exports = contentManager;
