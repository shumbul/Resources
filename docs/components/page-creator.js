#!/usr/bin/env node

/**
 * Simple Page Creator
 * Creates new HTML pages from the template with replacements
 */

const fs = require('fs');
const path = require('path');

class PageCreator {
    constructor(templatePath = './components/page-template.html') {
        this.templatePath = templatePath;
    }

    /**
     * Create a new page from template
     */
    createPage(config) {
        const {
            fileName,
            title,
            description,
            outputDir = './'
        } = config;

        try {
            // Read template
            const templateContent = fs.readFileSync(this.templatePath, 'utf8');
            
            // Replace placeholders
            let pageContent = templateContent
                .replace(/\{\{PAGE_TITLE\}\}/g, title)
                .replace(/\{\{PAGE_DESCRIPTION\}\}/g, description);

            // Write new file
            const outputPath = path.join(outputDir, fileName);
            fs.writeFileSync(outputPath, pageContent, 'utf8');
            
            console.log(`✅ Page created successfully: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('❌ Error creating page:', error.message);
            throw error;
        }
    }

    /**
     * Create multiple pages from a configuration array
     */
    createPages(configs) {
        const results = [];
        configs.forEach(config => {
            try {
                const result = this.createPage(config);
                results.push({ success: true, path: result, config });
            } catch (error) {
                results.push({ success: false, error: error.message, config });
            }
        });
        return results;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageCreator;
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: node page-creator.js <filename> <title> [description]');
        console.log('Example: node page-creator.js "new-roadmap.html" "New Roadmap" "Description of the new roadmap"');
        process.exit(1);
    }

    const creator = new PageCreator();
    const config = {
        fileName: args[0],
        title: args[1],
        description: args[2] || args[1]
    };

    creator.createPage(config);
}

// Browser usage (simplified)
if (typeof window !== 'undefined') {
    window.PageCreator = PageCreator;
}
