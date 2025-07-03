const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    excerpt: {
        type: String,
        required: true,
        maxlength: 300
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        default: 'God Save the Robots'
    },
    category: {
        type: String,
        required: true,
        enum: ['AI', 'Automation', 'LLM', 'Multimodal', 'Technology', 'Philosophy', 'Future'],
        default: 'AI'
    },
    tags: [{
        type: String,
        trim: true
    }],
    published: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: false
    },
    videoUrl: {
        type: String,
        trim: true
    },
    externalUrl: {
        type: String,
        trim: true
    },
    readingTime: {
        type: Number, // in minutes
        default: 5
    },
    views: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create slug from title before saving
articleSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim('-'); // Remove leading/trailing hyphens
    }
    
    // Calculate reading time based on content length
    if (this.isModified('content')) {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(/\s+/).length;
        this.readingTime = Math.ceil(wordCount / wordsPerMinute);
    }
    
    next();
});

// Virtual for formatted date
articleSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Static method to find published articles
articleSchema.statics.findPublished = function() {
    return this.find({ published: true }).sort({ date: -1 });
};

// Static method to find featured articles
articleSchema.statics.findFeatured = function() {
    return this.find({ published: true, featured: true }).sort({ date: -1 });
};

// Instance method to increment views
articleSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

module.exports = mongoose.model('Article', articleSchema);