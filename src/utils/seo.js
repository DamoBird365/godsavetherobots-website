const siteConfig = require('../../content/site-config.json');

/**
 * Generate structured data (JSON-LD) for articles
 * Optimized for search engines and AI agents
 */
const generateArticleStructuredData = (article) => {
  const baseUrl = siteConfig.site.baseUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": article.image ? `${baseUrl}${article.image}` : `${baseUrl}${siteConfig.seo.defaultImage}`,
    "author": {
      "@type": "Person",
      "name": article.author,
      "url": `${baseUrl}/about`
    },
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.site.name,
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/assets/logo.png`
      }
    },
    "datePublished": article.publishDate,
    "dateModified": article.lastModified || article.publishDate,
    "url": `${baseUrl}/articles/${article.slug}`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/articles/${article.slug}`
    },
    "keywords": article.tags ? article.tags.join(", ") : "",
    "articleSection": article.type,
    "wordCount": estimateWordCount(article.content),
    "timeRequired": `PT${article.readTime || 5}M`,
    "inLanguage": siteConfig.site.language,
    "isAccessibleForFree": true
  };
};

/**
 * Generate structured data for video articles
 */
const generateVideoStructuredData = (article) => {
  const baseData = generateArticleStructuredData(article);
  
  if (article.type === 'video' && article.videoUrl) {
    baseData["@type"] = "VideoObject";
    baseData.contentUrl = article.videoUrl;
    baseData.embedUrl = article.videoEmbedId ? 
      `https://www.youtube.com/embed/${article.videoEmbedId}` : 
      article.videoUrl;
    baseData.uploadDate = article.publishDate;
    baseData.duration = article.videoDuration || "PT10M"; // Default 10 minutes
  }
  
  return baseData;
};

/**
 * Generate comprehensive meta tags for SEO
 */
const generateMetaTags = (article, pageType = 'article') => {
  const baseUrl = siteConfig.site.baseUrl;
  const siteName = siteConfig.site.name;
  const defaultDescription = siteConfig.site.description;
  
  const meta = {
    // Basic meta tags
    title: pageType === 'home' ? 
      `${siteName} - ${siteConfig.site.tagline}` : 
      `${article.title} | ${siteName}`,
    description: article.description || defaultDescription,
    keywords: article.tags ? 
      [...article.tags, ...siteConfig.site.keywords].join(', ') : 
      siteConfig.site.keywords.join(', '),
    
    // Open Graph tags
    ogTitle: article.title || siteName,
    ogDescription: article.description || defaultDescription,
    ogImage: article.image ? `${baseUrl}${article.image}` : `${baseUrl}${siteConfig.seo.defaultImage}`,
    ogUrl: pageType === 'home' ? baseUrl : `${baseUrl}/articles/${article.slug}`,
    ogType: pageType === 'home' ? 'website' : 'article',
    ogSiteName: siteName,
    
    // Twitter Card tags
    twitterCard: siteConfig.seo.twitterCard,
    twitterTitle: article.title || siteName,
    twitterDescription: article.description || defaultDescription,
    twitterImage: article.image ? `${baseUrl}${article.image}` : `${baseUrl}${siteConfig.seo.defaultImage}`,
    twitterSite: siteConfig.site.social.twitter,
    
    // Article specific
    ...(pageType === 'article' && {
      articleAuthor: article.author,
      articlePublishedTime: article.publishDate,
      articleModifiedTime: article.lastModified || article.publishDate,
      articleSection: article.type,
      articleTag: article.tags ? article.tags.join(', ') : ''
    }),
    
    // Technical meta
    canonical: pageType === 'home' ? baseUrl : `${baseUrl}/articles/${article.slug}`,
    robots: article.status === 'published' ? 'index,follow' : 'noindex,nofollow',
    language: siteConfig.site.language
  };
  
  return meta;
};

/**
 * Generate breadcrumb structured data
 */
const generateBreadcrumbData = (article) => {
  const baseUrl = siteConfig.site.baseUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem", 
        "position": 2,
        "name": "Articles",
        "item": `${baseUrl}/articles`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": `${baseUrl}/articles/${article.slug}`
      }
    ]
  };
};

/**
 * Generate website/organization structured data
 */
const generateWebsiteStructuredData = () => {
  const baseUrl = siteConfig.site.baseUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteConfig.site.name,
    "alternateName": siteConfig.site.tagline,
    "description": siteConfig.site.description,
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": siteConfig.seo.structuredData.organization
  };
};

/**
 * Estimate word count from content
 */
const estimateWordCount = (content) => {
  if (!content) return 0;
  // Remove markdown syntax and count words
  const cleanContent = content
    .replace(/[#*_`\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return cleanContent.split(/\s+/).length;
};

/**
 * Calculate reading time based on word count
 */
const calculateReadingTime = (content, wordsPerMinute = 200) => {
  const wordCount = estimateWordCount(content);
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Generate sitemap data for all articles
 */
const generateSitemapData = (articles) => {
  const baseUrl = siteConfig.site.baseUrl;
  const now = new Date().toISOString();
  
  const urls = [
    {
      loc: baseUrl,
      lastmod: now,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: `${baseUrl}/articles`,
      lastmod: now,
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: now,
      changefreq: 'monthly',
      priority: '0.7'
    }
  ];
  
  // Add article URLs
  articles
    .filter(article => article.status === 'published')
    .forEach(article => {
      urls.push({
        loc: `${baseUrl}/articles/${article.slug}`,
        lastmod: article.lastModified || article.publishDate,
        changefreq: 'monthly',
        priority: article.featured ? '0.8' : '0.6'
      });
    });
  
  return urls;
};

/**
 * Generate RSS feed data
 */
const generateRSSData = (articles) => {
  const baseUrl = siteConfig.site.baseUrl;
  const site = siteConfig.site;
  
  return {
    title: site.name,
    description: site.description,
    feed_url: `${baseUrl}/rss.xml`,
    site_url: baseUrl,
    language: site.language,
    managingEditor: site.email,
    webMaster: site.email,
    copyright: `© ${new Date().getFullYear()} ${site.name}`,
    categories: siteConfig.site.keywords,
    pubDate: new Date(),
    items: articles
      .filter(article => article.status === 'published')
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, 20) // Latest 20 articles
      .map(article => ({
        title: article.title,
        description: article.description,
        url: `${baseUrl}/articles/${article.slug}`,
        guid: `${baseUrl}/articles/${article.slug}`,
        categories: article.tags || [],
        author: article.author,
        date: new Date(article.publishDate)
      }))
  };
};

module.exports = {
  generateArticleStructuredData,
  generateVideoStructuredData,
  generateMetaTags,
  generateBreadcrumbData,
  generateWebsiteStructuredData,
  estimateWordCount,
  calculateReadingTime,
  generateSitemapData,
  generateRSSData,
  siteConfig
};
