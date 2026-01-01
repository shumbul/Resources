// Theme Switcher Functionality
class ThemeSwitcher {
    constructor() {
        this.init();
    }

    init() {
        // Create theme switcher HTML if it doesn't exist
        if (!document.querySelector('.theme-switcher')) {
            this.createThemeSwitcher();
        }

        // Initialize event listeners
        this.setupEventListeners();

        // Load saved theme or default to purple
        this.loadTheme();
    }

    createThemeSwitcher() {
        const themeSwitcher = document.createElement('div');
        themeSwitcher.className = 'theme-switcher';
        themeSwitcher.innerHTML = `
            <button class="theme-switcher-toggle" id="themeToggle">🎨</button>
            <div class="theme-options" id="themeOptions">
                <div class="theme-option" data-theme="purple">
                    <div class="theme-color purple"></div>
                    <span>Purple</span>
                </div>
                <div class="theme-option" data-theme="blue">
                    <div class="theme-color blue"></div>
                    <span>Blue</span>
                </div>
                <div class="theme-option" data-theme="green">
                    <div class="theme-color green"></div>
                    <span>Green</span>
                </div>
                <div class="theme-option" data-theme="orange">
                    <div class="theme-color orange"></div>
                    <span>Orange</span>
                </div>
                <div class="theme-option" data-theme="red">
                    <div class="theme-color red"></div>
                    <span>Red</span>
                </div>
            </div>
        `;

        // Insert as first child of body
        document.body.insertBefore(themeSwitcher, document.body.firstChild);
    }

    setupEventListeners() {
        // Use a small delay to ensure elements are fully rendered
        setTimeout(() => {
            const themeToggle = document.getElementById('themeToggle');
            const themeOptions = document.getElementById('themeOptions');
            const themeOptionElements = document.querySelectorAll('.theme-option');

            if (!themeToggle || !themeOptions) {
                console.error('Theme switcher elements not found');
                return;
            }

            // Toggle theme options visibility
            themeToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                themeOptions.classList.toggle('show');
            });

            // Close theme options when clicking outside
            document.addEventListener('click', () => {
                themeOptions.classList.remove('show');
            });

            // Handle theme selection
            themeOptionElements.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const selectedTheme = option.getAttribute('data-theme');
                    this.applyTheme(selectedTheme);
                });
            });
        }, 100);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'purple';
        this.applyTheme(savedTheme);
    }

    applyTheme(themeName) {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Save theme preference
        localStorage.setItem('theme', themeName);
        
        // Close options
        const themeOptions = document.getElementById('themeOptions');
        if (themeOptions) {
            themeOptions.classList.remove('show');
        }
        
        // Show feedback
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const originalText = themeToggle.textContent;
            themeToggle.textContent = '✓';
            setTimeout(() => {
                themeToggle.textContent = originalText;
            }, 500);
        }
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ThemeSwitcher());
} else {
    new ThemeSwitcher();
}
