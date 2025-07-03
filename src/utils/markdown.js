const { marked } = require('marked');
const hljs = require('highlight.js');

// Configure marked with syntax highlighting
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {
                console.error('Syntax highlighting error:', err);
            }
        }
        return hljs.highlightAuto(code).value;
    },
    langPrefix: 'hljs language-',
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    xhtml: false
});

// Custom renderer for better HTML output
const renderer = new marked.Renderer();

// Override link rendering to add security attributes for external links
renderer.link = function(href, title, text) {
    // Handle null/undefined href values
    if (!href || typeof href !== 'string') {
        return `<span>${text || ''}</span>`;
    }
    
    const isExternal = href.startsWith('http') || href.startsWith('//');
    const titleAttr = title ? ` title="${title}"` : '';
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    
    return `<a href="${href}"${titleAttr}${targetAttr}>${text || ''}</a>`;
};

// Override image rendering for better responsive images
renderer.image = function(href, title, text) {
    // Handle null/undefined href values
    if (!href || typeof href !== 'string') {
        return `<span class="missing-image">${text || 'Missing image'}</span>`;
    }
    
    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : ' alt=""';
    
    return `<img src="${href}"${altAttr}${titleAttr} loading="lazy" class="article-image">`;
};

// Set the custom renderer
marked.use({ renderer });

/**
 * Convert markdown to HTML with syntax highlighting
 * @param {string} markdown - The markdown content to convert
 * @returns {string} HTML content
 */
const markdownToHtml = (markdown) => {
    if (!markdown) return '';
    
    try {
        return marked(markdown);
    } catch (error) {
        console.error('Markdown parsing error:', error);
        return markdown.replace(/[&<>"']/g, function(match) {
            const escape = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escape[match];
        });
    }
};

/**
 * Extract plain text from markdown (for excerpts, meta descriptions)
 * @param {string} markdown - The markdown content
 * @param {number} maxLength - Maximum length of extracted text
 * @returns {string} Plain text
 */
const extractPlainText = (markdown, maxLength = 160) => {
    if (!markdown) return '';
    
    // Remove markdown syntax
    let text = markdown
        .replace(/#{1,6}\s+/g, '') // Headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1') // Italic
        .replace(/`(.*?)`/g, '$1') // Inline code
        .replace(/```[\s\S]*?```/g, '') // Code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
        .replace(/\n+/g, ' ') // Multiple newlines to space
        .replace(/\s+/g, ' ') // Multiple spaces to single
        .trim();
    
    if (text.length <= maxLength) return text;
    
    // Truncate at word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

/**
 * Process article content with markdown parsing and enhancements
 * @param {Object} article - Article object with content property
 * @returns {Object} Enhanced article object
 */
const processArticleContent = (article) => {
    if (!article.content) return article;
    
    const htmlContent = markdownToHtml(article.content);
    const plainTextExcerpt = extractPlainText(article.content, 160);
    
    return {
        ...article,
        htmlContent,
        plainTextExcerpt
    };
};

// Legacy compatibility
const markdownUtils = {
    convertMarkdownToHTML: markdownToHtml,
    sanitizeMarkdown: (markdown) => markdown
};

module.exports = {
    markdownToHtml,
    extractPlainText,
    processArticleContent,
    marked,
    ...markdownUtils
};