const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const indexRoutes = require('./routes/index');
const articleRoutes = require('./routes/articles');

// Import content and SEO utilities
const contentManager = require('./utils/content');
const { generateSitemapData, generateRSSData } = require('./utils/seo');

const app = express();

// Set up Handlebars as the view engine
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '../views/layouts'),
    partialsDir: path.join(__dirname, '../views/partials'),
    helpers: {
        formatDate: function(date) {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        currentYear: function() {
            return new Date().getFullYear();
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));

// Middleware for serving static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up routes
app.use('/', indexRoutes);
app.use('/articles', articleRoutes);

// SEO and discoverability routes
app.get('/sitemap.xml', async (req, res) => {
    try {
        const articles = await contentManager.getPublishedArticles();
        const sitemapData = generateSitemapData(articles);
        
        res.set('Content-Type', 'application/xml');
        res.render('sitemap', { urls: sitemapData }, (err, xml) => {
            if (err) {
                console.error('Error generating sitemap:', err);
                return res.status(500).send('Error generating sitemap');
            }
            res.send(xml);
        });
    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});

app.get('/rss.xml', async (req, res) => {
    try {
        const articles = await contentManager.getPublishedArticles();
        const rssData = generateRSSData(articles);
        
        res.set('Content-Type', 'application/rss+xml');
        res.render('rss', rssData, (err, xml) => {
            if (err) {
                console.error('Error generating RSS feed:', err);
                return res.status(500).send('Error generating RSS feed');
            }
            res.send(xml);
        });
    } catch (error) {
        console.error('Error generating RSS feed:', error);
        res.status(500).send('Error generating RSS feed');
    }
});

app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Allow: /articles/
Allow: /contact/
Allow: /api/articles
Disallow: /admin/
Disallow: /private/

Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
`;
    
    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});