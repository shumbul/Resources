/* Mind map data.
 *
 * One entry per map. The renderer in mindmap.js turns these into the poster
 * layout on desktop and a stacked accordion on mobile, so nothing here needs
 * to know about layout.
 *
 * Fields
 *   kicker    small line above the title on the spine
 *   related   guides to send the reader to after the map
 *   branches  each with: title, icon, tone, optional href to a guide, nodes
 *   nodes     icon, label, sub, and an optional tag of 'must' or 'edge'
 *
 * Tones map to the pastel icon tiles: blue, green, purple, amber, rose, teal,
 * slate, orange.
 *
 * A branch's `href` is the point of putting these on the site rather than on
 * social media: the map says what to cover, the guide says how to do it.
 */

/* Converted from the hand-built Portfolio Sections infographic. Content is
 * unchanged; only the delivery is different. */
const portfolioSections = {
    kicker: 'The Portfolio Blueprint',
    title: 'What to Put in Each Portfolio Section',
    related: [
        { href: 'portfolio-building.html', label: 'Build it with AI prompts', icon: '🎨' },
        { href: 'resume-portfolio-templates.html', label: 'Resume & portfolio wording', icon: '📄' },
        { href: 'build-a-website.html', label: 'Hand-code it instead', icon: '🌐' },
    ],
    branches: [
        { title: 'Hero Section', icon: '🎯', tone: 'blue',
          href: 'portfolio-building.html', linkLabel: 'Prompts for the header line', nodes: [
            { icon: '📛', label: 'Your Name', sub: 'Big, bold, unmissable', tag: 'must' },
            { icon: '✍️', label: 'One-liner', sub: 'What you do plus who you help', tag: 'must' },
            { icon: '📸', label: 'Profile Photo', sub: 'Real headshot, well lit', tag: 'must' },
            { icon: '🔘', label: 'CTA Button', sub: '"View Work" or "Hire Me"', tag: 'must' },
            { icon: '⚙️', label: 'Stack Icons', sub: 'Four or five you actually use' },
            { icon: '📊', label: 'Social Proof Number', sub: 'Projects, followers, clients', tag: 'edge' },
        ]},
        { title: 'About Me', icon: '🙋', tone: 'green',
          href: 'portfolio-building.html', linkLabel: 'Prompt 5 writes this', nodes: [
            { icon: '💡', label: 'Origin Story', sub: 'How you got into tech', tag: 'must' },
            { icon: '🎯', label: 'Current Focus', sub: "What you're building now", tag: 'must' },
            { icon: '🏆', label: 'Past Wins', sub: 'Internships, clients, projects' },
            { icon: '😄', label: 'Personality Line', sub: 'One real human sentence', tag: 'edge' },
            { icon: '🎬', label: 'Video Intro', sub: 'Loom or YouTube embed', tag: 'edge' },
            { icon: '📄', label: 'Resume Link', sub: 'Direct PDF download', tag: 'must' },
        ]},
        { title: 'Projects', icon: '🚀', tone: 'purple',
          href: 'portfolio-building.html', linkLabel: 'Prompt 3 does the most work', nodes: [
            { icon: '🏷️', label: 'Project Title', sub: 'Clear, not clever', tag: 'must' },
            { icon: '💬', label: 'What it Does', sub: 'One line, plain English', tag: 'must' },
            { icon: '🛠️', label: 'Tech Used', sub: 'Stack pills or badges', tag: 'must' },
            { icon: '🌐', label: 'Live Demo', sub: 'Deployed and clickable', tag: 'must' },
            { icon: '🐙', label: 'GitHub Repo', sub: 'Clean code plus a README' },
            { icon: '📈', label: 'Result or Impact', sub: 'Numbers if you have them', tag: 'edge' },
        ]},
        { title: 'Skills', icon: '⚡', tone: 'amber',
          href: 'trending-tech-roles.html', linkLabel: 'What roles ask for', nodes: [
            { icon: '💻', label: 'Languages', sub: 'Python, JavaScript, and so on', tag: 'must' },
            { icon: '🧩', label: 'Frameworks', sub: 'React, Node, Django', tag: 'must' },
            { icon: '🔧', label: 'Tools', sub: 'VS Code, Figma, Git', tag: 'must' },
            { icon: '🤖', label: 'AI Tools', sub: 'Copilot, Claude, ChatGPT', tag: 'edge' },
            { icon: '📊', label: 'Skill Levels', sub: 'Visual bars, beginner to pro', tag: 'edge' },
            { icon: '📚', label: 'Currently Learning', sub: 'Shows a growth mindset', tag: 'edge' },
        ]},
        { title: 'Case Studies', icon: '📋', tone: 'rose',
          href: 'star-method.html', linkLabel: 'STAR gives you the structure', nodes: [
            { icon: '❓', label: 'The Brief', sub: 'What was the problem', tag: 'must' },
            { icon: '👤', label: 'Your Role', sub: 'Exactly what you did', tag: 'must' },
            { icon: '🗺️', label: 'Process', sub: 'How you approached it', tag: 'must' },
            { icon: '✅', label: 'Solution', sub: 'What you built', tag: 'must' },
            { icon: '📈', label: 'Outcome', sub: 'The result, in numbers', tag: 'must' },
            { icon: '🔁', label: 'Reflection', sub: "What you'd do differently", tag: 'edge' },
        ]},
        { title: 'Featured and Proof', icon: '⭐', tone: 'teal',
          href: 'linkedin-utilization-guide.html', linkLabel: 'Getting recommendations', nodes: [
            { icon: '💬', label: 'Testimonial', sub: 'A client or teammate quote', tag: 'must' },
            { icon: '🔗', label: 'LinkedIn Rec', sub: 'Screenshot or embed' },
            { icon: '🐙', label: 'GitHub Stats', sub: 'Contributions graph', tag: 'edge' },
            { icon: '🎓', label: 'Certifications', sub: 'Real ones only' },
            { icon: '✍️', label: 'Publications', sub: 'Blogs, articles, posts', tag: 'edge' },
            { icon: '🏅', label: 'Hackathon Projects', sub: 'Built under pressure', tag: 'edge' },
        ]},
        { title: 'Contact', icon: '📬', tone: 'blue',
          href: 'networking-toolkit.html', linkLabel: 'What to say when they reply', nodes: [
            { icon: '📧', label: 'Email', sub: 'A clickable mailto link', tag: 'must' },
            { icon: '🔗', label: 'LinkedIn', sub: 'Direct profile URL', tag: 'must' },
            { icon: '🐙', label: 'GitHub', sub: 'Your active profile', tag: 'must' },
            { icon: '🟢', label: 'WhatsApp or Cal.com', sub: 'Actually gets replies', tag: 'edge' },
            { icon: '📝', label: 'Contact Form', sub: 'Optional but professional', tag: 'edge' },
            { icon: '⏱️', label: 'Response Time', sub: '"Replies within 24 hours"', tag: 'edge' },
        ]},
        { title: 'Bonus Sections', icon: '💎', tone: 'orange',
          href: 'open-source-guide.html', linkLabel: 'Start contributing', nodes: [
            { icon: '📝', label: 'Blog or Writing', sub: 'Shows communication', tag: 'edge' },
            { icon: '🌍', label: 'Open Source', sub: 'Real project contributions', tag: 'edge' },
            { icon: '📰', label: 'Newsletter', sub: 'Builds authority over time', tag: 'edge' },
            { icon: '🧪', label: 'Side Projects', sub: 'Passion experiments', tag: 'edge' },
            { icon: '📅', label: 'Availability', sub: 'Calendar or booking link', tag: 'edge' },
            { icon: '🌙', label: 'Dark Mode Toggle', sub: 'Tiny detail, big impression', tag: 'edge' },
        ]},
    ],
};

/* Drawn from interview-prep-kit.html, star-method.html, dsa-practice-guide.html
 * and salary-negotiation-guide.html, so every branch has somewhere to send you. */
const interviewLoop = {
    kicker: 'The Interview Loop',
    title: 'Every Stage of a Tech Interview, and What Is Actually Being Tested',
    related: [
        { href: 'interview-prep-kit.html', label: 'Interview prep kit', icon: '🗣️' },
        { href: 'star-method.html', label: 'The STAR method', icon: '⭐' },
        { href: 'dsa-practice-guide.html', label: 'DSA practice', icon: '💻' },
        { href: 'salary-negotiation-guide.html', label: 'Negotiating the offer', icon: '💰' },
    ],
    branches: [
        { title: 'Before You Apply', icon: '🧭', tone: 'slate',
          href: 'ai-era-job-hunt.html', linkLabel: 'How hiring changed', nodes: [
            { icon: '🎯', label: 'Pick a Target Role', sub: 'You cannot prepare for everything', tag: 'must' },
            { icon: '📄', label: 'One-Page Resume', sub: 'Tailored per application', tag: 'must' },
            { icon: '🔗', label: 'A Link That Works', sub: 'Portfolio or GitHub', tag: 'must' },
            { icon: '📊', label: 'A Tracker', sub: 'Where you applied and when' },
            { icon: '🤝', label: 'Warm Referrals', sub: 'Far higher hit rate than cold', tag: 'edge' },
        ]},
        { title: 'Resume Screen', icon: '📄', tone: 'blue',
          href: 'resume-portfolio-templates.html', linkLabel: 'Templates and wording', nodes: [
            { icon: '🤖', label: 'Survives the ATS', sub: 'Plain layout, no columns', tag: 'must' },
            { icon: '📈', label: 'Impact, Not Duties', sub: 'Did X using Y, which caused Z', tag: 'must' },
            { icon: '🔑', label: 'Keywords From the Ad', sub: 'Their words, not yours', tag: 'must' },
            { icon: '📏', label: 'One Page', sub: 'Two only past about ten years' },
            { icon: '✂️', label: 'No Filler', sub: 'Cut "hardworking team player"', tag: 'edge' },
        ]},
        { title: 'Phone Screen', icon: '📞', tone: 'green',
          href: 'interview-prep-kit.html', linkLabel: 'Common opening questions', nodes: [
            { icon: '⏱️', label: 'Your 90-Second Pitch', sub: 'Rehearsed, not recited', tag: 'must' },
            { icon: '❓', label: 'Why This Company', sub: 'One specific, checkable reason', tag: 'must' },
            { icon: '💬', label: 'Talk Through a Project', sub: 'The one on your resume', tag: 'must' },
            { icon: '💰', label: 'Salary Expectations', sub: 'Give a researched range' },
            { icon: '🙋', label: 'Questions For Them', sub: 'Never say "no, I am good"', tag: 'edge' },
        ]},
        { title: 'Coding Round', icon: '💻', tone: 'purple',
          href: 'dsa-practice-guide.html', linkLabel: 'What to practise, in order', nodes: [
            { icon: '🗣️', label: 'Think Out Loud', sub: 'Silence reads as being stuck', tag: 'must' },
            { icon: '❓', label: 'Clarify First', sub: 'Inputs, edge cases, constraints', tag: 'must' },
            { icon: '🐢', label: 'Brute Force First', sub: 'Working beats elegant and unfinished', tag: 'must' },
            { icon: '⚡', label: 'Then Optimise', sub: 'Say the complexity out loud', tag: 'must' },
            { icon: '🧪', label: 'Test Your Own Code', sub: 'Walk one real example through' },
            { icon: '🧊', label: 'Recover From Freezing', sub: 'Say what you are considering', tag: 'edge' },
        ]},
        { title: 'System Design', icon: '🏗️', tone: 'amber',
          href: 'system-design-templates.html', linkLabel: 'Templates to structure it', nodes: [
            { icon: '📋', label: 'Gather Requirements', sub: 'Functional and non-functional', tag: 'must' },
            { icon: '🔢', label: 'Estimate Scale', sub: 'Users, reads, writes, storage', tag: 'must' },
            { icon: '🧱', label: 'Draw the Boxes', sub: 'Start simple, then evolve', tag: 'must' },
            { icon: '🗄️', label: 'Pick a Data Store', sub: 'And justify it', tag: 'must' },
            { icon: '⚖️', label: 'Name the Trade-offs', sub: 'This is the actual test', tag: 'edge' },
            { icon: '💥', label: 'Handle Failure', sub: 'What breaks, and what then', tag: 'edge' },
        ]},
        { title: 'Behavioural', icon: '⭐', tone: 'rose',
          href: 'star-method.html', linkLabel: 'STAR, with examples', nodes: [
            { icon: '📖', label: 'Six Stories, Reusable', sub: 'Most questions are the same six', tag: 'must' },
            { icon: '⭐', label: 'STAR Structure', sub: 'Situation, task, action, result', tag: 'must' },
            { icon: '👤', label: 'Say "I", Not "We"', sub: 'They are hiring you', tag: 'must' },
            { icon: '📉', label: 'A Real Failure', sub: 'With what you changed after', tag: 'must' },
            { icon: '🤝', label: 'A Conflict Story', sub: 'Resolved, not won', tag: 'edge' },
        ]},
        { title: 'The Offer', icon: '💰', tone: 'teal',
          href: 'salary-negotiation-guide.html', linkLabel: 'How to negotiate', nodes: [
            { icon: '🤐', label: 'Do Not Accept On the Call', sub: 'Thank them, ask for it in writing', tag: 'must' },
            { icon: '🔍', label: 'Research the Band', sub: 'Levels.fyi, Glassdoor, people', tag: 'must' },
            { icon: '📦', label: 'Read the Whole Package', sub: 'Base, bonus, equity, vesting', tag: 'must' },
            { icon: '💬', label: 'Ask Once, Politely', sub: 'A specific number and a reason' },
            { icon: '📝', label: 'Get It In Writing', sub: 'Before you resign anything', tag: 'must' },
        ]},
    ],
};

/* Drawn from git-guide.html and open-source-guide.html. The commands live in
 * the guides; this is the mental model of what the four areas are. */
const gitModel = {
    kicker: 'The Mental Model',
    title: 'Git, as Four Places Your Code Can Be',
    related: [
        { href: 'git-guide.html', label: 'The full Git guide', icon: '🚀' },
        { href: 'open-source-guide.html', label: 'Contributing to open source', icon: '🌍' },
        { href: 'build-a-website.html', label: 'Deploy with GitHub Pages', icon: '🌐' },
    ],
    branches: [
        { title: 'Working Directory', icon: '📝', tone: 'slate',
          href: 'git-guide.html', linkLabel: 'Status and diff', nodes: [
            { icon: '👀', label: 'Where You Edit', sub: 'The actual files on disk', tag: 'must' },
            { icon: '🔍', label: 'git status', sub: 'Run it constantly, it is free', tag: 'must' },
            { icon: '📊', label: 'git diff', sub: 'What changed but is not staged', tag: 'must' },
            { icon: '↩️', label: 'git restore', sub: 'Throw away a local change' },
            { icon: '🧹', label: 'git clean', sub: 'Remove untracked files, carefully', tag: 'edge' },
        ]},
        { title: 'Staging Area', icon: '📦', tone: 'amber',
          href: 'git-guide.html', linkLabel: 'Staging explained', nodes: [
            { icon: '➕', label: 'git add', sub: 'Choose what goes in the next commit', tag: 'must' },
            { icon: '🎯', label: 'Stage Selectively', sub: 'One commit, one idea', tag: 'must' },
            { icon: '➖', label: 'git restore --staged', sub: 'Take it back out' },
            { icon: '🔬', label: 'git add -p', sub: 'Stage part of a file', tag: 'edge' },
            { icon: '🚫', label: '.gitignore', sub: 'Never stage secrets or node_modules', tag: 'must' },
        ]},
        { title: 'Local Repository', icon: '🗃️', tone: 'green',
          href: 'git-guide.html', linkLabel: 'Commits, branches, history', nodes: [
            { icon: '💾', label: 'git commit', sub: 'A snapshot plus a message', tag: 'must' },
            { icon: '✍️', label: 'Write a Real Message', sub: 'Why, not what. The diff says what', tag: 'must' },
            { icon: '🌿', label: 'git branch', sub: 'One branch per piece of work', tag: 'must' },
            { icon: '🔀', label: 'git merge', sub: 'Bring a branch back in', tag: 'must' },
            { icon: '📜', label: 'git log', sub: 'The history you can search' },
            { icon: '🕰️', label: 'git stash', sub: 'Park work without committing', tag: 'edge' },
        ]},
        { title: 'Remote', icon: '☁️', tone: 'blue',
          href: 'open-source-guide.html', linkLabel: 'Working with other people', nodes: [
            { icon: '⬆️', label: 'git push', sub: 'Send your commits up', tag: 'must' },
            { icon: '⬇️', label: 'git pull', sub: 'Fetch plus merge, in one', tag: 'must' },
            { icon: '🔍', label: 'git fetch', sub: 'Look before you merge' },
            { icon: '🍴', label: 'Fork and PR', sub: 'How you contribute to others', tag: 'must' },
            { icon: '💣', label: 'Avoid force push', sub: 'It rewrites history for everyone', tag: 'must' },
        ]},
        { title: 'When It Goes Wrong', icon: '🚑', tone: 'rose',
          href: 'git-guide.html', linkLabel: 'Undoing things', nodes: [
            { icon: '⚔️', label: 'Merge Conflicts', sub: 'Git marks them, you decide', tag: 'must' },
            { icon: '↪️', label: 'git revert', sub: 'Undo safely, by adding a commit', tag: 'must' },
            { icon: '⏮️', label: 'git reset', sub: 'Move the branch pointer back' },
            { icon: '🧭', label: 'git reflog', sub: 'Almost nothing is truly lost', tag: 'edge' },
            { icon: '🔒', label: 'Committed a Secret?', sub: 'Rotate it. Removing it is not enough', tag: 'must' },
        ]},
    ],
};

export const MAPS = {
    'portfolio-sections': portfolioSections,
    'interview-loop': interviewLoop,
    'git-model': gitModel,
};

/* Used by the hub page and the nav so the list of maps lives in one place. */
export const MAP_INDEX = [
    { slug: 'portfolio-sections', file: 'mindmap-portfolio-sections.html',
      title: 'The Portfolio Blueprint', icon: '🎨', tone: 'purple',
      blurb: 'Eight sections, and the exact elements that turn a forgettable page into one that gets replies.' },
    { slug: 'interview-loop', file: 'mindmap-interview-loop.html',
      title: 'The Interview Loop', icon: '🗣️', tone: 'blue',
      blurb: 'Every stage from resume screen to offer, and what each one is really testing.' },
    { slug: 'git-model', file: 'mindmap-git-model.html',
      title: 'Git in Four Places', icon: '🚀', tone: 'green',
      blurb: 'Stop memorising commands. Once you know where your code is, the commands follow.' },
];
