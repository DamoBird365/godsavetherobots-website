const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Article listing page
router.get('/', articleController.getAllArticles);

// Search articles
router.get('/search', articleController.searchArticles);

// API endpoints for AI agents and future integrations
router.get('/api/articles', articleController.getArticlesAPI);
router.get('/api/featured', articleController.getFeaturedArticles);

// Individual article pages - must be last to avoid conflicts
router.get('/:slug', articleController.getArticleBySlug);

module.exports = router;