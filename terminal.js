class Terminal {
  constructor() {
    this.output = document.getElementById('output');
    this.input = document.getElementById('commandInput');
    this.history = [];
    this.historyIndex = -1;
    this.sounds = {
      success: new Audio('ES_Computer, OS Retro, Bit, GUI, Pling, Blip, Coin, Level Up 01 - Epidemic Sound.mp3'),
      error: new Audio('ES_Computer, Digital Beep, Short - Epidemic Sound - 1076-1372.wav')
    };
    this.extensionData = null;
    this.generationQueue = [];
    this.isGenerating = false;
    this.extensions = new Map(); // Store created extensions by serial number
    this.nextSerialNumber = 1000; // Start serial numbers from 1000
    this.setupEventListeners();
    this.printWelcomeMessage();

    // Add permissions documentation
    this.permissionsDoc = {
      "activeTab": {
        desc: "Temporary access to the active tab through user gesture",
        warning: null
      },
      "alarms": {
        desc: "Schedule periodic tasks",
        warning: null 
      },
      "audio": {
        desc: "Access audio settings and management",
        warning: null
      },
      "background": {
        desc: "Early startup and late shutdown capabilities",
        warning: null
      },
      "bookmarks": {
        desc: "Access bookmarks API",
        warning: "Read and change your bookmarks"
      },
      "browsingData": {
        desc: "Clear browsing data",
        warning: null
      },
      "clipboardRead": {
        desc: "Read clipboard content",
        warning: "Read data you copy and paste"
      },
      "clipboardWrite": {
        desc: "Write to clipboard",
        warning: "Modify data you copy and paste"
      },
      "contextMenus": {
        desc: "Add items to context menu",
        warning: null
      },
      "cookies": {
        desc: "Read and modify cookies",
        warning: "Read and modify website cookies"
      },
      "downloads": {
        desc: "Manage downloads",
        warning: "Manage your downloads"
      },
      "history": {
        desc: "Access browsing history",
        warning: "Read and change your browsing history"
      },
      "identity": {
        desc: "Get user identity information",
        warning: "Know your email address"
      },
      "notifications": {
        desc: "Show desktop notifications",
        warning: "Display notifications"
      },
      "storage": {
        desc: "Store and retrieve data",
        warning: null
      },
      "tabs": {
        desc: "Access browser tabs",
        warning: "Read your browsing history"
      },
      "webRequest": {
        desc: "Intercept network requests",
        warning: "Read and modify network traffic"
      }
    };
  }

  async playSound(type) {
    try {
      await this.sounds[type].play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  setupEventListeners() {
    this.input.addEventListener('keydown', (e) => this.handleInput(e));
    this.input.addEventListener('keyup', (e) => this.handleArrowKeys(e));

    Object.values(this.sounds).forEach(sound => {
      sound.addEventListener('ended', () => {
        sound.currentTime = 0;
      });
    });
  }

  printWelcomeMessage() {
    const asciiArt = `
██████╗ ███████╗ ██████╗████████╗
██╔══██╗██╔════╝██╔════╝╚══██╔══╝
██████╔╝█████╗  ██║        ██║   
██╔══██╗██╔══╝  ██║        ██║   
██████╔╝███████╗╚██████╗   ██║   
╚═════╝ ╚══════╝ ╚═════╝   ╚═╝   
🚀 Browser Extension Creator Terminal v1.0.2
🎨 Created by @Louis9887
`;
    this.println(asciiArt, 'brand');
    this.println('\n🎉 Welcome to Browser Extension Creator Terminal');
    this.println('💡 Type \'help\' for available commands.\n');
    
    const startupText = [
      '🔧 Initializing extension creation environment...',
      '⚙️ Loading command interface...',
      '🌐 Connecting to extension generator...',
      '✨ System ready.'
    ];
    
    let delay = 0;
    startupText.forEach((text, index) => {
      setTimeout(() => {
        this.println(text + (index < startupText.length - 1 ? ' ✅' : ''));
        if (index === startupText.length - 1) {
          this.playSound('success');
        }
      }, delay);
      delay += 500;
    });
  }

  println(text, className = '') {
    const line = document.createElement('div');
    line.className = `output-line ${className}`;
    
    if (text.includes('```')) {
      line.innerHTML = marked.parse(text);
      line.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    } else {
      const content = document.createElement('span');
      content.className = 'typewriter';
      content.textContent = text;
      line.appendChild(content);
    }
    
    this.output.appendChild(line);
    this.output.scrollTop = this.output.scrollHeight;
  }

  showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading';
    loader.innerHTML = '<div></div><div></div><div></div>';
    this.output.appendChild(loader);
    return loader;
  }

  async handleInput(e) {
    if (e.key !== 'Enter') return;
    
    const command = this.input.value.trim();
    if (!command) return;
    
    if (this.awaitingInput) {
      await this.handleStepInput(command);
    } else {
      await this.playSound('success');
      this.history.push(command);
      this.historyIndex = this.history.length;
      this.println(`$ ${command}`);
      this.input.value = '';
      await this.executeCommand(command);
    }
  }

  handleArrowKeys(e) {
    if (e.key === 'ArrowUp') {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.input.value = this.history[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.input.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.input.value = '';
      }
    }
  }

  async executeCommand(command) {
    const [cmd, ...args] = command.split(' ');

    try {
      switch (cmd.toLowerCase()) {
        case 'help':
          this.println(`
🚀 Available Commands:
  📚 help                                    Show this help message
  🧹 clear                                   Clear the terminal
  ⚡ create                                  Start the extension creation wizard
  ✏️ edit <serial> <prompt>                  Edit an extension with AI assistance
  🔧 fix <serial>                           Fix issues in an extension
  🎯 enhance <serial> <prompt>               Enhance an extension with features
  📋 list                                    List all created extensions
  🔍 install <serial>                       Show installation guide for an extension
  💡 guidance <topic>                       Get detailed AI guidance on extension topics
  
📝 Examples:
  create                                  # Start creating a new extension
  edit 1000 "Add dark mode support"       # Edit extension #1000 
  fix 1000                               # Fix issues in extension #1000
  enhance 1000 "Add keyboard shortcuts"   # Enhance extension #1000
  install 1000                           # Show installation guide for #1000
  guidance "content_scripts"             # Learn about content scripts
  guidance "permissions"                 # Learn about extension permissions
  guidance "api"                         # Learn about Chrome Extension API

💡 Topics for guidance command:
  • content_scripts  - Learn about content script implementation
  • permissions     - Understand extension permissions
  • api             - Chrome Extension API usage and best practices
  • manifest        - Manifest.json configuration
  • storage         - Data storage methods
  • messaging       - Communication between extension components
`);
          await this.playSound('success');
          break;

        case 'install':
          if (args.length < 1) {
            throw new Error('Usage: install <serial>');
          }
          await this.showInstallationGuide(args[0]);
          break;

        case 'edit':
          if (args.length < 2) {
            throw new Error('Usage: edit <serial> <prompt>');
          }
          await this.editExtension(args[0], args.slice(1).join(' '));
          break;

        case 'fix':
          if (args.length < 1) {
            throw new Error('Usage: fix <serial>');
          }
          await this.fixExtension(args[0]);
          break;

        case 'enhance':
          if (args.length < 2) {
            throw new Error('Usage: enhance <serial> <prompt>');
          }
          await this.enhanceExtension(args[0], args.slice(1).join(' '));
          break;

        case 'list':
          this.listExtensions();
          break;

        case 'clear':
          this.output.innerHTML = '';
          await this.playSound('success');
          break;
        
        case 'create':
          await this.startCreationWizard();
          break;

        case 'guidance':
          if (args.length < 1) {
            throw new Error('Usage: guidance <topic> - Example topics: content_scripts, permissions, api, manifest, storage, messaging');
          }
          await this.showGuidance(args.join(' '));
          break;

        default:
          await this.playSound('error');
          this.println(`❌ Error executing command: ${cmd}. Type 'help' for available commands.`, 'error');
      }
    } catch (error) {
      await this.playSound('error');
      this.println(`❌ Error executing command: ${error.message}`, 'error');
    }
  }

  listExtensions() {
    if (this.extensions.size === 0) {
      this.println('📭 No extensions created in this session.', 'error');
      return;
    }

    this.println('\n📦 Created Extensions:');
    for (const [serial, ext] of this.extensions) {
      this.println(`
🔷 Serial #${serial}:
  📝 Name: ${ext.data.name}
  📄 Description: ${ext.data.description}
  🔢 Version: ${ext.data.version}
`);
    }
  }

  async editExtension(serial, prompt) {
    if (!this.extensions.has(parseInt(serial))) {
      throw new Error(`Extension #${serial} not found. Use 'list' to see available extensions.`);
    }

    const extension = this.extensions.get(parseInt(serial));
    this.println(`\nEditing extension #${serial} with prompt: "${prompt}"...`);
    // Implement AI-based editing here
    await this.regenerateExtension(extension, prompt, 'edit');
  }

  async fixExtension(serial) {
    if (!this.extensions.has(parseInt(serial))) {
      throw new Error(`Extension #${serial} not found. Use 'list' to see available extensions.`);
    }

    const extension = this.extensions.get(parseInt(serial));
    this.println(`\nAnalyzing and fixing issues in extension #${serial}...`);
    // Implement AI-based fixing here
    await this.regenerateExtension(extension, 'Fix any issues and improve code quality', 'fix');
  }

  async enhanceExtension(serial, prompt) {
    if (!this.extensions.has(parseInt(serial))) {
      throw new Error(`Extension #${serial} not found. Use 'list' to see available extensions.`);
    }

    const extension = this.extensions.get(parseInt(serial));
    this.println(`\nEnhancing extension #${serial} with prompt: "${prompt}"...`);
    // Implement AI-based enhancement here
    await this.regenerateExtension(extension, prompt, 'enhance');
  }

  async startCreationWizard() {
    this.extensionData = {
      step: 1,
      data: {}
    };
    await this.showNextStep();
  }

  async showNextStep() {
    const steps = {
      1: {
        title: '📝 Basic Information',
        fields: [
          { name: 'name', prompt: '📦 Extension Name:', validation: /^[a-zA-Z0-9\s-]{3,45}$/ },
          { name: 'description', prompt: '📄 Description:', validation: /^[\w\s.,!?()-]{10,500}$/ },
          { name: 'version', prompt: '🔢 Version (e.g., 1.0.0):', validation: /^\d+\.\d+\.\d+$/ }
        ]
      },
      2: {
        title: '🌐 Browser Support',
        fields: [
          { name: 'browsers', prompt: '🔌 Supported browsers (comma-separated: chrome,firefox,edge):', validation: /^[a-z,]+$/ }
        ]
      },
      3: {
        title: '🔒 Permissions',
        fields: [
          { name: 'permissions', prompt: '🔑 Required permissions (comma-separated: storage,tabs,activeTab):', validation: /^[a-z,]*$/ }
        ]
      },
      4: {
        title: '⚙️ Features',
        fields: [
          { name: 'popup', prompt: '🖼️ Include popup? (yes/no):', validation: /^(yes|no)$/ },
          { name: 'background', prompt: '⚡ Include background script? (yes/no):', validation: /^(yes|no)$/ },
          { name: 'content', prompt: '📄 Include content script? (yes/no):', validation: /^(yes|no)$/ }
        ]
      }
    };

    if (this.extensionData.step > Object.keys(steps).length) {
      await this.generateExtension();
      return;
    }

    const currentStep = steps[this.extensionData.step];
    this.println(`\nStep ${this.extensionData.step}/${Object.keys(steps).length}: ${currentStep.title}`);
    
    this.extensionData.currentFields = currentStep.fields;
    this.extensionData.currentFieldIndex = 0;
    
    await this.promptNextField();
  }

  async promptNextField() {
    const fields = this.extensionData.currentFields;
    const fieldIndex = this.extensionData.currentFieldIndex;
    
    if (fieldIndex >= fields.length) {
      this.extensionData.step++;
      await this.showNextStep();
      return;
    }

    const field = fields[fieldIndex];
    
    // Special handling for permissions field
    if (field.name === 'permissions') {
      this.println('\n🔒 Available Permissions:');
      this.println('\n📗 Common permissions (no warnings):');
      Object.entries(this.permissionsDoc)
        .filter(([key, value]) => !value.warning) // Show non-warning permissions first
        .forEach(([key, value]) => {
          this.println(`• ${key}: ${value.desc}`);
        });
      
      this.println('\n⚠️ Permissions with warnings:');
      Object.entries(this.permissionsDoc)
        .filter(([key, value]) => value.warning) // Then show permissions with warnings
        .forEach(([key, value]) => {
          this.println(`• ${key}: ${value.desc}`);
          this.println(`  ⚠️ Warning: ${value.warning}`);
        });

      this.println('\n💡 Enter permissions as a comma-separated list. Example: storage,tabs,activeTab');
    }
    
    this.println('\n' + field.prompt);
    this.awaitingInput = field.name;
  }

  async handleStepInput(input) {
    const fields = this.extensionData.currentFields;
    const fieldIndex = this.extensionData.currentFieldIndex;
    const field = fields[fieldIndex];
    
    const value = input.trim().toLowerCase();
    
    // Special validation for permissions
    if (field.name === 'permissions') {
      const permissions = value.split(',').map(p => p.trim()).filter(p => p);
      const invalidPerms = permissions.filter(p => !this.permissionsDoc[p]);
      
      if (invalidPerms.length > 0) {
        await this.playSound('error');
        this.println(`❌ Invalid permissions: ${invalidPerms.join(', ')}`, 'error');
        return;
      }
      
      // Show warnings for requested permissions
      const warningPerms = permissions.filter(p => this.permissionsDoc[p].warning);
      if (warningPerms.length > 0) {
        this.println('\n⚠️ Warning: This extension will require the following permissions:');
        warningPerms.forEach(p => {
          this.println(`• ${p}: ${this.permissionsDoc[p].warning}`);
        });
      }
    }
    
    if (field.validation.test(value)) {
      this.extensionData.data[field.name] = value;
      await this.playSound('success');
      this.extensionData.currentFieldIndex++;
      this.input.value = '';
      this.awaitingInput = null;
      await this.promptNextField();
    } else {
      await this.playSound('error');
      this.println('Invalid input. Please try again.', 'error');
    }
  }

  async generateExtension() {
    const loader = this.showLoading();
    this.println('\nGenerating extension...');
    
    try {
      const { data } = this.extensionData;
      const serialNumber = this.nextSerialNumber++;
      
      // Store extension data
      this.extensions.set(serialNumber, {
        serialNumber,
        data: { ...data },
        files: []
      });

      // Create manifest.json content
      const manifest = {
        manifest_version: 3,
        name: data.name,
        description: data.description,
        version: data.version,
        permissions: data.permissions.split(',').filter(p => p),
        browser_action: data.popup === 'yes' ? { default_popup: 'popup.html' } : undefined,
        background: data.background === 'yes' ? { service_worker: 'background.js' } : undefined,
        content_scripts: data.content === 'yes' ? [{
          matches: ['<all_urls>'],
          js: ['content.js']
        }] : undefined
      };

      // Queue up files for procedural generation
      this.generationQueue = [
        {
          filename: 'manifest.json',
          content: JSON.stringify(manifest, null, 2),
          type: 'json'
        }
      ];

      if (data.popup === 'yes') {
        this.generationQueue.push(
          {
            filename: 'popup.html',
            content: `<!DOCTYPE html>
<html>
<head>
  <title>${data.name}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      width: 300px;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: #0066ff;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background: #0052cc;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>${data.name}</h2>
    <p>${data.description}</p>
    <div id="content"></div>
    <button id="actionButton">Activate</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
            type: 'html'
          },
          {
            filename: 'popup.js',
            content: `// Popup Script for ${data.name}
document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup interface
  const contentDiv = document.getElementById('content');
  const actionButton = document.getElementById('actionButton');

  // Extension state management
  let isActive = false;

  // Handle button clicks
  actionButton.addEventListener('click', function() {
    isActive = !isActive;
    actionButton.textContent = isActive ? 'Deactivate' : 'Activate';
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: isActive ? 'activate' : 'deactivate' 
    });
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'statusUpdate') {
      contentDiv.textContent = message.content;
    }
  });
});`,
            type: 'javascript'
          }
        );
      }

      if (data.background === 'yes') {
        this.generationQueue.push({
          filename: 'background.js',
          content: `// Background Script for ${data.name}

// Initialize extension state
let extensionState = {
  isActive: false,
  settings: {}
};

// Handle extension installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed');
  
  // Initialize storage with default settings
  await chrome.storage.local.set({
    extensionState: extensionState
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.action) {
    case 'activate':
      extensionState.isActive = true;
      handleExtensionActivation();
      break;
    case 'deactivate':
      extensionState.isActive = false;
      handleExtensionDeactivation();
      break;
    default:
      console.log('Unknown action:', message.action);
  }
});

function handleExtensionActivation() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'extensionStatus',
        status: 'active'
      });
    }
  });
}

function handleExtensionDeactivation() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'extensionStatus',
        status: 'inactive'
      });
    }
  });
}`,
          type: 'javascript'
        });
      }

      if (data.content === 'yes') {
        this.generationQueue.push({
          filename: 'content.js',
          content: `// Content Script for ${data.name}

// Initialize content script
console.log('${data.name} content script initialized');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'extensionStatus') {
    handleExtensionStatusChange(message.status);
  }
});

// Handle extension status changes
function handleExtensionStatusChange(status) {
  if (status === 'active') {
    initializeFeatures();
  } else {
    deactivateFeatures();
  }
}

// Initialize extension features
function initializeFeatures() {
  // Add your feature initialization here
  console.log('Initializing extension features');
  
  // Example: Add event listeners
  document.addEventListener('click', handleDocumentClick);
}

// Deactivate extension features
function deactivateFeatures() {
  // Clean up any event listeners or modifications
  console.log('Deactivating extension features');
  
  // Example: Remove event listeners
  document.removeEventListener('click', handleDocumentClick);
}

// Example event handler
function handleDocumentClick(event) {
  // Add your click handling logic here
  console.log('Document clicked:', event.target);
}`,
          type: 'javascript'
        });
      }

      // Start the generation process
      loader.remove();
      this.println(`\nExtension created with serial number: #${serialNumber}`, 'success');
      this.println('\nStarting procedural file generation...', 'success');
      await this.processGenerationQueue(serialNumber);

    } catch (error) {
      loader.remove();
      await this.playSound('error');
      this.println(`Error generating extension: ${error.message}`, 'error');
      console.error('Full error:', error);
    }
  }

  async processGenerationQueue(serialNumber) {
    if (this.isGenerating || this.generationQueue.length === 0) {
      if (this.generationQueue.length === 0) {
        await this.playSound('success');
        this.println('\n🎉 File generation complete! 🎉', 'success');
        
        const completionText = [
          '📦 Packaging extension files...',
          '🔨 Generating distribution package...',
          '📥 Preparing download...',
          '✨ Extension ready!'
        ];
        
        let delay = 0;
        for (const text of completionText) {
          await new Promise(resolve => setTimeout(resolve, 500));
          this.println(text + ' ✅');
        }

        // Create zip file
        const zip = new JSZip();
        const extension = this.extensions.get(serialNumber);
        
        // Add all generated files to zip
        extension.files.forEach(file => {
          zip.file(file.filename, file.content);
        });

        // Generate and download zip
        const blob = await zip.generateAsync({type: 'blob'});
        saveAs(blob, `extension_${serialNumber}.zip`);

        this.println('\n📦 Extension package downloaded!', 'success');
        this.println('\n📝 Installation instructions:', 'success');
        this.println(`
1. 📦 Unzip the downloaded extension_${serialNumber}.zip file
2. 🌐 Open Chrome and go to chrome://extensions
3. 🔧 Enable "Developer mode" in the top right
4. 📁 Click "Load unpacked" in the top left
5. 📂 Select the unzipped extension directory
6. ✨ Your extension is now installed!

🛠️ Available commands for this extension:
🔄 edit ${serialNumber} "<prompt>"    : Edit the extension
🔧 fix ${serialNumber}               : Fix any issues
⚡ enhance ${serialNumber} "<prompt>" : Add new features
`);
      }
      return;
    }

    this.isGenerating = true;
    const file = this.generationQueue.shift();

    this.println(`\nGenerating ${file.filename}...`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second cooldown

    this.println(`Content of ${file.filename}:`);
    this.println('```' + file.type + '\n' + file.content + '\n```');
    
    // Store generated file
    const extension = this.extensions.get(serialNumber);
    extension.files.push(file);
    
    await this.playSound('success');
    this.isGenerating = false;
    await this.processGenerationQueue(serialNumber);
  }

  async regenerateExtension(extension, prompt, mode) {
    const loader = this.showLoading();
    this.println(`\nRegenerating extension files based on ${mode} prompt...`);
    
    try {
      // Re-generate files with AI modifications
      this.generationQueue = [...extension.files];
      loader.remove();
      
      this.println('\nStarting procedural file regeneration...', 'success');
      await this.processGenerationQueue(extension.serialNumber);

    } catch (error) {
      loader.remove();
      await this.playSound('error');
      this.println(`Error ${mode}ing extension: ${error.message}`, 'error');
    }
  }

  async showInstallationGuide(serial) {
    if (!this.extensions.has(parseInt(serial))) {
      throw new Error(`Extension #${serial} not found. Use 'list' to see available extensions.`);
    }

    const extension = this.extensions.get(parseInt(serial));
    
    this.println('\n📦 Installation Guide', 'success');
    this.println(`
Extension #${serial}: ${extension.data.name}

📥 Installation Steps:

1. 📦 Locate and unzip the downloaded extension_${serial}.zip file
2. 🌐 Open Chrome and navigate to chrome://extensions
3. 🔧 Enable "Developer mode" using the toggle in the top right corner
4. 📁 Click "Load unpacked" button in the top left
5. 📂 Browse and select the unzipped extension directory
6. ✨ The extension will be installed and ready to use!

🔍 After Installation:
• Look for the extension icon in your browser's toolbar
• Click the icon to open the extension popup (if available)
• Check the extension settings for any configuration options

🛠️ Supported Browsers:
${extension.data.browsers.split(',').map(browser => `• ${browser.charAt(0).toUpperCase() + browser.slice(1)}`).join('\n')}

⚙️ Permissions Used:
${extension.data.permissions ? extension.data.permissions.split(',').map(perm => `• ${perm}`).join('\n') : '• No special permissions required'}

🔄 Extension Management Commands:
• edit ${serial} "<prompt>"    : Modify the extension
• fix ${serial}               : Fix any issues
• enhance ${serial} "<prompt>" : Add new features
`);
    await this.playSound('success');
  }

  async showGuidance(topic) {
    const loader = this.showLoading();
    this.println(`\n🔍 Fetching detailed guidance about: ${topic}...`);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Predefined guidance topics
      const guidanceContent = {
        'content_scripts': {
          title: '📑 Content Scripts Guide',
          content: `
Content Scripts are JavaScript files that run in the context of web pages.

🔑 Key Points:
• Content scripts can read and modify web pages
• They have access to the DOM of pages they're injected into
• They can communicate with the background script

📝 Example manifest.json configuration:
\`\`\`json
{
  "content_scripts": [{
    "matches": ["*://*.example.com/*"],
    "js": ["content.js"],
    "css": ["styles.css"],
    "run_at": "document_idle"
  }]
}
\`\`\`

💡 Best Practices:
1. Use "matches" patterns carefully
2. Avoid heavy processing in content scripts
3. Use messaging for background script communication
4. Consider using "run_at" for script timing

🛠️ Common Use Cases:
• Modifying page content
• Adding custom styles
• Injecting buttons/widgets
• Reading page data
• Form manipulation

⚠️ Limitations:
• No access to chrome.* APIs directly
• Isolated JavaScript environment
• Cannot modify other extension scripts

🔗 Related Topics:
• guidance messaging (for background communication)
• guidance permissions (for required permissions)
• guidance manifest (for configuration)
`
        },
        'permissions': {
          title: '🔒 Extension Permissions Guide',
          content: `
Permissions control what your extension can access.

📋 Common Permissions:
• storage - Store extension data
• tabs - Access browser tabs
• activeTab - Access current tab
• contextMenus - Add right-click menu items
• webRequest - Monitor/modify network requests

⚙️ Example manifest.json:
\`\`\`json
{
  "permissions": [
    "storage",
    "activeTab",
    "https://*.example.com/*"
  ],
  "optional_permissions": [
    "bookmarks",
    "history"
  ]
}
\`\`\`

🎯 Best Practices:
1. Request minimal permissions
2. Use optional_permissions when possible
3. Explain why each permission is needed
4. Use activeTab instead of tabs when possible

⚠️ Important Notes:
• More permissions = more user scrutiny
• Some permissions show warning prompts
• Host permissions require careful consideration

🔗 Related Topics:
• guidance manifest (for configuration)
• guidance api (for using permissions)
`
        },
        'api': {
          title: '⚡ Chrome Extension API Guide',
          content: `
Chrome provides powerful APIs for extension development.

🔧 Core APIs:
• chrome.runtime - Extension lifecycle
• chrome.storage - Data storage
• chrome.tabs - Tab management
• chrome.windows - Window management
• chrome.commands - Keyboard shortcuts

📝 Example Usage:
\`\`\`javascript
// Storage API
chrome.storage.local.set({key: 'value'}, function() {
  console.log('Value is set');
});

// Tabs API
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {action: 'getData'});
});
\`\`\`

🎯 Best Practices:
1. Use async/await with chrome.* APIs
2. Handle errors appropriately
3. Check API availability
4. Use event listeners efficiently

⚠️ Common Pitfalls:
• Not checking API availability
• Ignoring error callbacks
• Misusing async APIs
• Memory leaks in event listeners

🔗 Related Topics:
• guidance messaging (for communication)
• guidance permissions (for required permissions)
`
        },
        // Add more topics as needed
      };

      const guidance = guidanceContent[topic.toLowerCase()] || {
        title: '🤖 AI-Generated Guidance',
        content: `Generating custom guidance for: ${topic}...
        
Sorry, this topic isn't in our predefined list, but here are some general tips:

1. Check the Chrome Extension documentation
2. Join developer communities
3. Look for example extensions
4. Test thoroughly
5. Start simple and iterate

Try these predefined topics:
• guidance content_scripts
• guidance permissions
• guidance api
`
      };

      loader.remove();
      await this.playSound('success');
      this.println(`\n${guidance.title}`, 'success');
      this.println(guidance.content);
      
    } catch (error) {
      loader.remove();
      await this.playSound('error');
      this.println(`Error fetching guidance: ${error.message}`, 'error');
    }
  }

}

// Initialize the terminal
const terminal = new Terminal();