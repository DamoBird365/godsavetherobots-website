// Article Controller
// Handles article listing and individual article display with full SEO optimization
const contentManager = require('../utils/content');
const { 
    generateArticleStructuredData, 
    generateVideoStructuredData,
    generateMetaTags,
    generateBreadcrumbData 
} = require('../utils/seo');

class ArticleController {
    // Get all published articles with filtering and search
    async getAllArticles(req, res) {
        try {
            const { tag, type, search, page = 1 } = req.query;
            let articles;
            
            if (search) {
                articles = await contentManager.searchArticles(search);
            } else if (tag) {
                articles = await contentManager.getArticlesByTag(tag);
            } else if (type) {
                articles = await contentManager.getArticlesByType(type);
            } else {
                articles = await contentManager.getPublishedArticles();
            }
            
            // Pagination (10 articles per page)
            const articlesPerPage = 10;
            const startIndex = (page - 1) * articlesPerPage;
            const endIndex = startIndex + articlesPerPage;
            const paginatedArticles = articles.slice(startIndex, endIndex);
            const totalPages = Math.ceil(articles.length / articlesPerPage);
            
            // Get all tags for filter dropdown
            const allTags = await contentManager.getAllTags();
            
            // Get article archive for sidebar
            const archive = await contentManager.getArticleArchive();
            
            // Generate meta tags for the articles page
            let pageTitle = 'Sacred Scriptures - Digital Articles & Wisdom';
            let pageDescription = 'Explore our collection of articles on AI, automation, agentic workflows, and the future of technology';
            
            if (search) {
                pageTitle = `Search Results for "${search}" - God Save the Robots`;
                pageDescription = `Search results for "${search}" in our digital archives`;
            } else if (tag) {
                pageTitle = `Articles tagged "${tag}" - God Save the Robots`;
                pageDescription = `All articles tagged with ${tag}`;
            } else if (type) {
                pageTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Content - God Save the Robots`;
                pageDescription = `All ${type} content from our digital sanctuary`;
            }
            
            const metaTags = generateMetaTags({
                title: pageTitle,
                description: pageDescription,
                tags: allTags.slice(0, 10) // Top 10 tags for SEO
            }, 'articles');
            
            res.render('articles', { 
                title: metaTags.title,
                articles: paginatedArticles,
                allTags,
                archive,
                currentTag: tag,
                currentType: type,
                searchQuery: search,
                currentPage: parseInt(page),
                totalPages,
                hasNextPage: endIndex < articles.length,
                hasPreviousPage: page > 1,
                totalArticles: articles.length,
                meta: metaTags,
                isArticles: true,
                currentYear: new Date().getFullYear()
            });
        } catch (error) {
            console.error('Error fetching articles:', error);
            res.status(500).render('error', { 
                title: 'Divine Interference Detected',
                message: 'The sacred scrolls are temporarily inaccessible due to divine interference',
                error: process.env.NODE_ENV === 'development' ? error : {},
                currentYear: new Date().getFullYear()
            });
        }
    }

    // Get single article by slug with full SEO optimization
    async getArticleBySlug(req, res) {
        try {
            const { slug } = req.params;
            const article = await contentManager.getArticleBySlug(slug);
            
            if (!article) {
                return res.status(404).render('error', { 
                    title: 'Sacred Text Not Found',
                    message: 'The sacred text you seek has not been found in our digital archives',
                    error: { status: 404 },
                    currentYear: new Date().getFullYear()
                });
            }
            
            // Get related articles based on tags
            const relatedArticles = await contentManager.getRelatedArticles(article, 3);
            
            // Generate comprehensive SEO data
            const metaTags = generateMetaTags(article, 'article');
            const structuredData = article.type === 'video' ? 
                generateVideoStructuredData(article) : 
                generateArticleStructuredData(article);
            const breadcrumbData = generateBreadcrumbData(article);
            
            // Format publish date for display
            const publishDate = new Date(article.publishDate);
            const formattedDate = publishDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            res.render('article', { 
                title: metaTags.title,
                article: {
                    ...article,
                    formattedDate,
                    publishDate: publishDate
                },
                relatedArticles,
                meta: metaTags,
                structuredData: JSON.stringify(structuredData),
                breadcrumbData: JSON.stringify(breadcrumbData),
                currentYear: new Date().getFullYear()
            });
        } catch (error) {
            console.error('Error fetching article:', error);
            res.status(500).render('error', { 
                title: 'Divine Interference Detected',
                message: 'Divine interference detected while loading the sacred text',
                error: process.env.NODE_ENV === 'development' ? error : {},
                currentYear: new Date().getFullYear()
            });
        }
    }

    // Get featured articles for homepage
    async getFeaturedArticles(req, res) {
        try {
            const articles = await contentManager.getFeaturedArticles(3);
            res.json(articles);
        } catch (error) {
            console.error('Error retrieving featured articles:', error);
            res.status(500).json({ 
                error: 'Unable to retrieve featured articles',
                message: 'Divine interference detected'
            });
        }
    }

    // API endpoint for articles (for future AI agent access)
    async getArticlesAPI(req, res) {
        try {
            const { limit = 20, offset = 0, tag, type, search } = req.query;
            let articles;
            
            if (search) {
                articles = await contentManager.searchArticles(search, limit);
            } else if (tag) {
                articles = await contentManager.getArticlesByTag(tag, limit);
            } else if (type) {
                articles = await contentManager.getArticlesByType(type, limit);
            } else {
                articles = await contentManager.getLatestArticles(limit);
            }
            
            // Apply offset
            const offsetArticles = articles.slice(offset);
            
            res.json({
                articles: offsetArticles,
                total: articles.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offsetArticles.length === parseInt(limit)
            });
        } catch (error) {
            console.error('Error in articles API:', error);
            res.status(500).json({ 
                error: 'API temporarily blessed with divine interference',
                message: error.message
            });
        }
    }

    // Search articles
    async searchArticles(req, res) {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.redirect('/articles');
        }

        try {
            const articles = await contentManager.searchArticles(q.trim());
            
            const metaTags = generateMetaTags({
                title: `Search Results for "${q}" - God Save the Robots`,
                description: `Search results for "${q}" in our digital archives`,
                tags: ['search', 'articles']
            }, 'search');

            res.render('articles', {
                title: metaTags.title,
                articles,
                searchQuery: q,
                meta: metaTags,
                isArticles: true,
                currentYear: new Date().getFullYear()
            });
        } catch (error) {
            console.error('Error searching articles:', error);
            res.render('articles', {
                title: 'Search Error - God Save the Robots',
                articles: [],
                searchQuery: q,
                error: 'Search functionality is temporarily blessed with digital interference',
                isArticles: true,
                currentYear: new Date().getFullYear()
            });
        }
    }
}

module.exports = new ArticleController();