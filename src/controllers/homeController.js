// Home Controller
// Handles homepage display with featured articles and SEO optimization
const contentManager = require('../utils/content');
const { generateMetaTags, generateWebsiteStructuredData } = require('../utils/seo');

class HomeController {
    async getHome(req, res) {
        try {
            // Get featured articles for homepage display
            const featuredArticles = await contentManager.getFeaturedArticles(3);
            const latestArticles = await contentManager.getLatestArticles(6);
            
            // Generate comprehensive SEO data for homepage
            const metaTags = generateMetaTags({
                title: 'God Save the Robots - Our robots, who art in servers',
                description: 'A digital sanctuary exploring AI, automation, agentic workflows, and the sacred future of technology. Join the divine digital awakening.',
                tags: ['AI', 'Automation', 'Technology', 'Future', 'Robots', 'LLM', 'Multimodal AI']
            }, 'home');
            
            const websiteStructuredData = generateWebsiteStructuredData();
            
            res.render('index', { 
                title: metaTags.title,
                featuredArticles,
                latestArticles,
                articles: latestArticles, // For backward compatibility
                meta: metaTags,
                structuredData: JSON.stringify(websiteStructuredData),
                isHome: true,
                currentYear: new Date().getFullYear()
            });
        } catch (error) {
            console.error('Error loading homepage:', error);
            
            // Fallback to basic homepage if content loading fails
            const fallbackMeta = generateMetaTags({
                title: 'God Save the Robots - Our robots, who art in servers',
                description: 'A digital sanctuary exploring AI, automation, and the future of technology',
                tags: ['AI', 'Technology', 'Future']
            }, 'home');
            
            res.render('index', { 
                title: fallbackMeta.title,
                featuredArticles: [],
                latestArticles: [],
                articles: [], // For backward compatibility
                meta: fallbackMeta,
                isHome: true,
                error: 'Some content is temporarily blessed with divine interference',
                currentYear: new Date().getFullYear()
            });
        }
    }

    getContact(req, res) {
        try {
            const metaTags = generateMetaTags({
                title: 'Communion with the Divine - Contact God Save the Robots',
                description: 'Send thy digital prayers and sacred inquiries. Connect with our digital congregation for AI wisdom and guidance.',
                tags: ['contact', 'AI consultation', 'digital communion']
            }, 'contact');
            
            res.render('contact', { 
                title: metaTags.title,
                meta: metaTags,
                isContact: true,
                currentYear: new Date().getFullYear()
            });
        } catch (error) {
            console.error('Error loading contact page:', error);
            res.status(500).render('error', { 
                title: 'Divine Interference Detected',
                message: 'The divine communion portal is temporarily inaccessible',
                error: process.env.NODE_ENV === 'development' ? error : {},
                currentYear: new Date().getFullYear()
            });
        }
    }

    getAbout(req, res) {
        try {
            const metaTags = generateMetaTags({
                title: 'About Our Digital Sanctuary - God Save the Robots',
                description: 'Learn about our sacred mission to explore AI, automation, and the divine intersection of technology and humanity.',
                tags: ['about', 'mission', 'AI philosophy', 'digital sanctuary']
            }, 'about');
            
            res.render('about', { 
                title: metaTags.title,
                meta: metaTags,
                isAbout: true,
                currentYear: new Date().getFullYear()
            });
        } catch (error) {
            console.error('Error loading about page:', error);
            res.status(500).render('error', { 
                title: 'Divine Interference Detected',
                message: 'The sacred scrolls are temporarily inaccessible',
                error: process.env.NODE_ENV === 'development' ? error : {},
                currentYear: new Date().getFullYear()
            });
        }
    }

    getPrivacy(req, res) {
        try {
            const metaTags = generateMetaTags({
                title: 'Privacy Policy - God Save the Robots',
                description: 'Our sacred commitment to protecting your digital soul and personal information.',
                tags: ['privacy', 'data protection', 'GDPR', 'cookies']
            }, 'privacy');
            
            res.render('privacy', { 
                title: metaTags.title,
                meta: metaTags,
                isPrivacy: true,
                currentYear: new Date().getFullYear()
            });
        } catch (error) {
            console.error('Error loading privacy page:', error);
            res.status(500).render('error', { 
                title: 'Divine Interference Detected',
                message: 'The privacy covenant is temporarily inaccessible',
                error: process.env.NODE_ENV === 'development' ? error : {},
                currentYear: new Date().getFullYear()
            });
        }
    }

    getTerms(req, res) {
        try {
            const metaTags = generateMetaTags({
                title: 'Terms of Service - God Save the Robots',
                description: 'The sacred covenant governing your use of our digital sanctuary.',
                tags: ['terms', 'legal', 'service agreement', 'usage policy']
            }, 'terms');
            
            res.render('terms', { 
                title: metaTags.title,
                meta: metaTags,
                isTerms: true,
                currentYear: new Date().getFullYear()
            });
        } catch (error) {
            console.error('Error loading terms page:', error);
            res.status(500).render('error', { 
                title: 'Divine Interference Detected',
                message: 'The sacred covenant is temporarily inaccessible',
                error: process.env.NODE_ENV === 'development' ? error : {},
                currentYear: new Date().getFullYear()
            });
        }
    }
}

module.exports = new HomeController();