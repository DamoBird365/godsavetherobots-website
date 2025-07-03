const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const articleController = require('../controllers/articleController');

// Home route
router.get('/', homeController.getHome);

// Contact routes
router.get('/contact', homeController.getContact);

// Legal and info pages
router.get('/about', homeController.getAbout);
router.get('/privacy', homeController.getPrivacy);
router.get('/terms', homeController.getTerms);

// Articles routes
router.use('/articles', require('./articles'));

module.exports = router;