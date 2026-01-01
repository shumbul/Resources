/**
 * Simple Component Loader
 * Loads HTML components into placeholders
 */

class ComponentLoader {
    constructor(basePath = './components/') {
        this.basePath = basePath;
        this.loadedComponents = new Map();
    }

    /**
     * Load a component and cache it
     */
    async loadComponent(componentName) {
        if (this.loadedComponents.has(componentName)) {
            return this.loadedComponents.get(componentName);
        }

        try {
            const response = await fetch(`${this.basePath}${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }
            
            const html = await response.text();
            this.loadedComponents.set(componentName, html);
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return '';
        }
    }

    /**
     * Insert component into a specific element
     */
    async insertComponent(componentName, targetElement) {
        const html = await this.loadComponent(componentName);
        if (html && targetElement) {
            targetElement.innerHTML = html;
            
            // Execute any scripts in the loaded component
            const scripts = targetElement.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                if (script.src) {
                    newScript.src = script.src;
                }
                script.parentNode.replaceChild(newScript, script);
            });
        }
    }

    /**
     * Load all components marked with data-component attribute
     */
    async loadAllComponents() {
        const componentElements = document.querySelectorAll('[data-component]');
        
        const promises = Array.from(componentElements).map(async (element) => {
            const componentName = element.getAttribute('data-component');
            if (componentName) {
                await this.insertComponent(componentName, element);
            }
        });

        await Promise.all(promises);
    }

    /**
     * Initialize the component loader when DOM is ready
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadAllComponents());
        } else {
            this.loadAllComponents();
        }
    }
}

// Create global instance
window.componentLoader = new ComponentLoader();

// Auto-initialize if this script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.componentLoader.init();
    });
} else {
    window.componentLoader.init();
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
