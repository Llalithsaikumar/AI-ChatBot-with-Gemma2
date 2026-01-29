class EnhancedChatbot {
  constructor() {
    this.apiConfig = {
      baseUrl: 'http://localhost:5000',
      endpoints: {
        chat: '/chat',
        simpleChat: '/chat/simple',
        clear: '/chat/clear',
        status: '/status'
      }
    };

    this.settings = {
      theme: 'dark',
      streaming: true,
      autoScroll: true,
      showTimestamps: true,
      saveConversations: true
    };

    this.state = {
      isConnected: true,
      isTyping: false,
      currentSessionId: null,
      sessions: new Map(),
      sidebarOpen: false
    };

    this.messageId = 0;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log('🚀 Setting up Enhanced Chatbot...');
    try {
      this.getElements();
      this.loadSettings();
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      this.applyTheme();
      this.checkConnection();
      this.initializeSessions();
      this.focusInput();
      console.log('✅ Chatbot setup complete');
    } catch (error) {
      console.error('❌ Setup failed:', error);
      this.showToast('Setup Error', 'Failed to initialize chatbot', 'error');
    }
  }

  getElements() {
    // Main elements
    this.messageInput = document.getElementById('messageInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.chatMessages = document.getElementById('chatMessages');
    this.charCounter = document.getElementById('charCounter');
    this.typingIndicator = document.getElementById('typingIndicator');
    this.welcomeMessage = document.getElementById('welcomeMessage');

    // Header elements
    this.statusIndicator = document.getElementById('statusIndicator');
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.currentChatTitle = document.getElementById('currentChatTitle');
    this.themeToggle = document.getElementById('themeToggle');

    // Sidebar elements
    this.sidebar = document.getElementById('sidebar');
    this.sidebarToggle = document.getElementById('sidebarToggle');
    this.newChatBtn = document.getElementById('newChatBtn');
    this.chatSessions = document.getElementById('chatSessions');

    // Modal elements
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsClose = document.getElementById('settingsClose');
    this.searchModal = document.getElementById('searchModal');
    this.searchBtn = document.getElementById('searchBtn');
    this.searchClose = document.getElementById('searchClose');
    this.searchInput = document.getElementById('searchInput');
    this.searchResults = document.getElementById('searchResults');

    // Settings controls
    this.themeSelect = document.getElementById('themeSelect');
    this.streamingToggle = document.getElementById('streamingToggle');
    this.autoScrollToggle = document.getElementById('autoScrollToggle');
    this.timestampsToggle = document.getElementById('timestampsToggle');
    this.saveConversationsToggle = document.getElementById('saveConversationsToggle');

    // Action buttons
    this.exportBtn = document.getElementById('exportBtn');
    this.clearAllBtn = document.getElementById('clearAllBtn');

    // Toast container
    this.toastContainer = document.getElementById('toastContainer');

    // Validate required elements
    if (!this.messageInput) {
      console.error('❌ messageInput element not found');
      throw new Error('messageInput element not found');
    }
    if (!this.sendBtn) {
      console.error('❌ sendBtn element not found');
      throw new Error('sendBtn element not found');
    }
    if (!this.chatMessages) {
      console.error('❌ chatMessages element not found');
      throw new Error('chatMessages element not found');
    }
    
    console.log('✅ All required DOM elements found');
  }

  setupEventListeners() {
    // Message input and sending
    this.messageInput.addEventListener('input', () => {
      this.autoResizeInput();
      this.updateSendButton();
      this.updateCharCounter();
      this.saveDraft();
    });

    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    this.sendBtn.addEventListener('click', () => this.handleSendMessage());

    // Header actions
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }

    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Sidebar actions
    if (this.newChatBtn) {
      this.newChatBtn.addEventListener('click', () => this.createNewSession());
    }

    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.showSettings());
    }

    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => this.showSearch());
    }

    // Modal handlers
    this.setupModalHandlers();
    // Settings handlers
    this.setupSettingsHandlers();

    // Session management
    if (this.chatSessions) {
      this.chatSessions.addEventListener('click', (e) => this.handleSessionClick(e));
    }

    // Load draft on focus
    this.messageInput.addEventListener('focus', () => this.loadDraft());
  }

  setupModalHandlers() {
    // Settings modal
    if (this.settingsClose) {
      this.settingsClose.addEventListener('click', () => this.hideSettings());
    }
    if (this.settingsModal) {
      this.settingsModal.addEventListener('click', (e) => {
        if (e.target === this.settingsModal) this.hideSettings();
      });
    }
    
    // Search modal
    if (this.searchClose) {
      this.searchClose.addEventListener('click', () => this.hideSearch());
    }
    if (this.searchModal) {
      this.searchModal.addEventListener('click', (e) => {
        if (e.target === this.searchModal) this.hideSearch();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.performSearch(e.target.value);
      });
    }
  }

  setupSettingsHandlers() {
    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        this.updateSetting('theme', e.target.value);
        this.applyTheme();
      });
    }

    if (this.streamingToggle) {
      this.streamingToggle.addEventListener('change', (e) => {
        this.updateSetting('streaming', e.target.checked);
      });
    }

    if (this.autoScrollToggle) {
      this.autoScrollToggle.addEventListener('change', (e) => {
        this.updateSetting('autoScroll', e.target.checked);
      });
    }

    if (this.timestampsToggle) {
      this.timestampsToggle.addEventListener('change', (e) => {
        this.updateSetting('showTimestamps', e.target.checked);
      });
    }

    if (this.saveConversationsToggle) {
      this.saveConversationsToggle.addEventListener('change', (e) => {
        this.updateSetting('saveConversations', e.target.checked);
      });
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportCurrentChat());
    }

    if (this.clearAllBtn) {
      this.clearAllBtn.addEventListener('click', () => this.clearAllData());
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            this.createNewSession();
            break;
          case 'f':
            e.preventDefault();
            this.showSearch();
            break;
          case ',':
            e.preventDefault();
            this.showSettings();
            break;
        }
      }
      
      if (e.key === 'Escape') {
        this.hideModals();
      }
    });
  }

  // Session Management
  initializeSessions() {
    this.loadSessionsFromStorage();
    if (this.state.sessions.size === 0) {
      this.createSession('default', 'New Chat');
    }

    this.renderSessions();
    // Switch to the first available session or create new one
    const firstSessionId = this.state.sessions.keys().next().value;
    this.switchToSession(firstSessionId);
  }

  createSession(id, title = 'New Chat') {
    const session = {
      id: id,
      title: title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.state.sessions.set(id, session);
    this.saveSessionsToStorage();
    return session;
  }

  createNewSession() {
    const sessionId = `session_${Date.now()}`;
    const session = this.createSession(sessionId, 'New Chat');
    this.renderSessions();
    this.switchToSession(sessionId);
    this.showToast('New Chat', 'Created new chat session', 'info');
    this.focusInput();
  }

  switchToSession(sessionId) {
    if (!this.state.sessions.has(sessionId)) {
      console.error('Session not found:', sessionId);
      return;
    }

    this.state.currentSessionId = sessionId;
    const session = this.state.sessions.get(sessionId);
    
    // Update UI
    if (this.currentChatTitle) {
      this.currentChatTitle.textContent = session.title;
    }

    // Clear current messages and load session messages
    this.clearMessages();
    this.loadSessionMessages(session);
    
    // Update active session in sidebar
    this.updateActiveSession(sessionId);
    
    // Save state
    this.saveSessionsToStorage();
  }

  loadSessionMessages(session) {
    if (session.messages.length === 0) {
      this.showWelcomeMessage();
      return;
    }

    session.messages.forEach(message => {
      this.addMessageToUI(message.role, message.content, false);
    });
  }

  // Message Handling
  async handleSendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.state.isTyping) return;

    try {
      // Add user message
      this.addMessageToUI('user', message);
      this.addMessageToSession('user', message);
      this.clearInput();

      // Update session title if it's the first message
      const session = this.state.sessions.get(this.state.currentSessionId);
      if (session && session.messages.length === 1 && session.title === 'New Chat') {
        const title = this.generateSessionTitle(message);
        this.updateSessionTitle(this.state.currentSessionId, title);
      }

      // Probe connection, but do not block sending; backend will fall back to RAG/offline
      this.checkConnection().catch(() => {});

      // Send to API
      if (this.settings.streaming) {
        await this.sendStreamingMessage(message);
      } else {
        await this.sendSimpleMessage(message);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      this.showToast('Send Error', 'Failed to send message', 'error');
      this.hideTypingIndicator();
    }
  }

  showOfflineMessage() {
    const offlineMessage = 'The bot is offline right now. Start the model server and try again.';
    this.addMessageToUI('bot', offlineMessage);
    this.addMessageToSession('bot', offlineMessage);
    this.showToast('Offline', offlineMessage, 'error');
  }

  async sendStreamingMessage(message) {
    this.showTypingIndicator();
    
    try {
      const response = await fetch(`${this.apiConfig.baseUrl}${this.apiConfig.endpoints.chat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });

      if (!response.ok) {
        this.setConnectionState('error', 'Offline');
        this.hideTypingIndicator();
        this.showOfflineMessage();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = '';
      let messageElement = null;

      this.hideTypingIndicator();
      messageElement = this.addMessageToUI('bot', '', false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.content) {
                botMessage += data.content;
                this.updateMessageContent(messageElement, botMessage);
              }

              if (data.done) {
                this.addMessageToSession('bot', botMessage);
                return;
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming send failed:', error);
      this.setConnectionState('error', 'Offline');
      this.hideTypingIndicator();
      if (messageElement) messageElement.remove();
      this.showOfflineMessage();
    }
  }

  async sendSimpleMessage(message) {
    this.showTypingIndicator();
    
    setTimeout(() => {
      this.hideTypingIndicator();
      
      // Enhanced demo responses with code examples
      let response;
      if (message.toLowerCase().includes('matrix multiplication') || message.toLowerCase().includes('c program')) {
        response = `You got it! Here's a C program demonstrating matrix multiplication:

\`\`\`c
#include <stdio.h>

int main() {
    int M, N, P; // Dimensions of matrices
    float A[10][10], B[10][10], C[10][10]; // Matrices for input and output

    printf("Enter the number of rows (M): ");
    scan("%d", &M);
    printf("Enter the number of columns (N): ");
    scanf("%d", &N);
    printf("Enter the number of columns (P): ");
    scanf("%d", &P);

    printf("Enter elements of matrix A:\n");
    for (int i = 0; i < M; ++i) {
        for (int j = 0; j < N; ++j) {
            scanf("%f", &A[i][j]);
        }
    }

    printf("Enter elements of matrix B:\n");
    for (int i = 0; i < N; ++i) {
        for (int j = 0; j < P; ++j) {
            scanf("%f", &B[i][j]);
        }
    }

    // Calculate the product matrix C using nested loops
    printf("Resultant matrix:\n");
    for (int i = 0; i < M; ++i) {
        for (int j = 0; j < P; ++j) {
            C[i][j] = 0; // Initialize C to 0 for each element
            for (int k = 0; k < N; ++k) { // Iterate through columns of A
                C[i][j] += A[i][k] * B[k][j]; // Calculate sum across rows and columns
            }
        }
    }

    printf("\n"); // Print a newline for spacing

    for (int i = 0; i < M; ++i) {
        for (int j = 0; j < P; ++j) {
            printf("%f ", C[i][j]); // Print the elements of matrix C
        }
        printf("\n");
    }

    return 0;
}
\`\`\`

## Explanation:
• **Input**: The code prompts the user to enter the dimensions (rows, columns) of the matrices.
• **Matrix Declaration**: The program uses nested arrays to represent the matrices (A, B, C). The size can be easily modified based on your requirements.
• **Multiplication Logic**: The heart of the code is a series of nested loops:
  1. Outer loop (i): Iterates through rows of matrix A and B
  2. Inner loop (j): Iterates through columns of matrix A and B to perform calculations for each element in C
  3. Inner Loop (k): This is the crucial step where we calculate the dot product between the rows of A and the columns of B. The code uses an inner loop to iterate through the columns of A and sum up products for matrix C

• **Output**: The program prints the resulting matrix C to the console.

## How to Run the Code

1. Save the code as a \`.c\` file (e.g., \`matrix_mult.c\`).
2. Compile it using a C compiler like GCC: \`gcc matrix_mult.c -o matrix_mult\`
3. Execute the compiled program: \`./matrix_mult\`

## Important Notes:

• **Matrix Dimensions**: Make sure you enter valid dimensions for your matrices (M, N, and P).
• **Order Matters**: The order of multiplication is crucial in this algorithm!`;
      } else if (message.toLowerCase().includes('virat')) {
        response = "I'd be happy to help you with information about Virat! 😊\n\nCould you clarify which Virat you're asking about? Here are some possibilities:\n\n• **Virat Kohli** - Famous Indian cricket captain and batsman\n• **Someone from your college** - If you're asking about a specific person\n• **Another public figure named Virat**\n\nPlease let me know which Virat you're interested in learning about! 🤝";
      } else if (message.toLowerCase().includes('hod')) {
        response = "## 📞 Contact Information\n\n• 👨‍🏫 **HOD, Computer Science Engineering:** Dr. N. Deepak Kumar\n• 📞 **Phone:** 9705840995\n• 📧 **Email:** deepakkumarsvuphd@gmail.com\n\nLet me know if you have any more questions about the college! 🎓";
      } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
        response = "👋 Hello! I'm Neural AI, your intelligent assistant. How can I help you today? 🤝";
      } else {
        response = `I understand you're asking about "${message}". I'm here to help with various tasks including:\n\n• Programming and coding assistance 💻\n• College information and queries 🎓\n• General questions and explanations 💡\n• Problem-solving support 🔧\n\nWhat specific information are you looking for? 🤝`;
      }
      
      this.addMessageToUI('bot', response);
      this.addMessageToSession('bot', response);
    }, 1000);
  }

  addMessageToUI(role, content, animate = true) {
    const messageGroup = this.createMessageElement(role, content);
    
    // Remove welcome message if present
    if (this.welcomeMessage && this.welcomeMessage.parentNode) {
      this.welcomeMessage.remove();
    }

    this.chatMessages.appendChild(messageGroup);

    if (animate) {
      messageGroup.style.opacity = '0';
      messageGroup.style.transform = 'translateY(10px)';
      requestAnimationFrame(() => {
        messageGroup.style.transition = 'all 0.3s ease';
        messageGroup.style.opacity = '1';
        messageGroup.style.transform = 'translateY(0)';
      });
    }

    this.scrollToBottom();
    return messageGroup;
  }

  createMessageElement(role, content) {
    const messageGroup = document.createElement('div');
    messageGroup.className = `message-group ${role}`;
    messageGroup.dataset.messageId = ++this.messageId;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

    if (role === 'bot') {
      messageBubble.innerHTML = this.formatBotMessage(content);
    } else {
      messageBubble.textContent = content;
    }

    const messageMeta = this.createMessageMeta(role, content);

    messageContent.appendChild(messageBubble);
    messageContent.appendChild(messageMeta);
    messageGroup.appendChild(avatar);
    messageGroup.appendChild(messageContent);

    // Setup code copy buttons if it's a bot message
    if (role === 'bot') {
      setTimeout(() => this.setupCodeCopyButtons(messageGroup), 100);
    }

    return messageGroup;
  }

  // UPDATED: Enhanced message formatting with better code handling
  formatBotMessage(content) {
    if (!content) return '';
    
    // Clean up the content
    content = content.trim();
    
    // FIRST: Handle code blocks before other processing
    content = this.formatCodeBlocks(content);
    
    // Handle headers (##, ###, ####)
    content = content.replace(/^### (.*$)/gim, '<h3 class="response-header-3">$1</h3>');
    content = content.replace(/^## (.*$)/gim, '<h2 class="response-header-2">$1</h2>');
    content = content.replace(/^# (.*$)/gim, '<h1 class="response-header-1">$1</h1>');
    
    // Handle bold text patterns like **Text:** and **Text**
    content = content.replace(/\*\*([^*]+):\*\*/g, '<strong class="bold-label">$1:</strong>');
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle bullet points and lists
    content = this.formatLists(content);
    
    // Handle links and emails
    content = this.formatLinks(content);
    
    // Handle inline code (but not if it's inside a code block)
    content = content.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');
    
    // Handle paragraphs and line breaks
    content = this.formatParagraphs(content);
    
    return content;
  }

  // FIXED: Enhanced code block formatting
  formatCodeBlocks(content) {
    // First handle triple backticks with language
    content = content.replace(/``````/g, (match, lang, code) => {
      const language = lang || 'text';
      const codeId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return `
        <div class="code-block">
          <div class="code-header">
            <span class="code-language">${language}</span>
            <button class="copy-code-btn" data-code-id="${codeId}" title="Copy code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre class="code-content" data-code-id="${codeId}"><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>
        </div>
      `;
    });

    // Also handle single backticks (for incomplete code blocks)
    content = content.replace(/``(\w+)?\n?([\s\S]*?)`$/gm, (match, lang, code) => {
      const language = lang || 'text';
      const codeId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return `
        <div class="code-block">
          <div class="code-header">
            <span class="code-language">${language}</span>
            <button class="copy-code-btn" data-code-id="${codeId}" title="Copy code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre class="code-content" data-code-id="${codeId}"><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>
        </div>
      `;
    });
    
    return content;
  }

  // FIXED: Enhanced code copy functionality
  setupCodeCopyButtons(container) {
    // Wait a bit for DOM to be ready
    setTimeout(() => {
      const copyButtons = container.querySelectorAll('.copy-code-btn');
      
      copyButtons.forEach(button => {
        // Remove any existing listeners
        button.replaceWith(button.cloneNode(true));
        const newButton = container.querySelector(`[data-code-id="${button.dataset.codeId}"]`);
        
        newButton.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const codeId = newButton.dataset.codeId;
          const codeElement = container.querySelector(`pre[data-code-id="${codeId}"] code`);
          
          if (codeElement) {
            const code = codeElement.textContent || codeElement.innerText;
            const success = await this.copyToClipboard(code);
            
            if (success) {
              const originalHTML = newButton.innerHTML;
              newButton.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Copied!
              `;
              
              // Show success toast
              this.showToast('Copied!', 'Code copied to clipboard', 'success');
              
              setTimeout(() => {
                newButton.innerHTML = originalHTML;
              }, 2000);
            } else {
              this.showToast('Copy Failed', 'Failed to copy code to clipboard', 'error');
            }
          }
        });
      });
    }, 200);
  }

  // ENHANCED: Better clipboard copy with fallback
  async copyToClipboard(text) {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        return this.fallbackCopyToClipboard(text);
      }
    } catch (err) {
      console.error('Clipboard API failed:', err);
      return this.fallbackCopyToClipboard(text);
    }
  }

  // Fallback copy method for older browsers
  fallbackCopyToClipboard(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  }

  // FIXED: Better list formatting that handles code blocks
  formatLists(content) {
    const lines = content.split('\n');
    let formattedLines = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're entering or leaving a code block
      if (line.includes('<div class="code-block">')) {
        inCodeBlock = true;
      } else if (line.includes('</div>') && inCodeBlock) {
        inCodeBlock = false;
      }
      
      // Don't process lists inside code blocks
      if (inCodeBlock) {
        formattedLines.push(line);
        continue;
      }
      
      // Check for numbered lists (1. 2. 3. etc.)
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        if (!inOrderedList) {
          if (inUnorderedList) {
            formattedLines.push('</ul>');
            inUnorderedList = false;
          }
          formattedLines.push('<ol class="formatted-list ordered">');
          inOrderedList = true;
        }
        formattedLines.push(`<li>${numberedMatch[2]}</li>`);
        continue;
      }
      
      // Check for bullet points (• or * or -)
      const bulletMatch = line.match(/^[•\*\-]\s+(.+)/);
      if (bulletMatch) {
        if (!inUnorderedList) {
          if (inOrderedList) {
            formattedLines.push('</ol>');
            inOrderedList = false;
          }
          formattedLines.push('<ul class="formatted-list unordered">');
          inUnorderedList = true;
        }
        formattedLines.push(`<li>${bulletMatch[1]}</li>`);
        continue;
      }
      
      // If we hit a non-list line, close any open lists
      if (inOrderedList) {
        formattedLines.push('</ol>');
        inOrderedList = false;
      }
      if (inUnorderedList) {
        formattedLines.push('</ul>');
        inUnorderedList = false;
      }
      
      formattedLines.push(line);
    }
    
    // Close any remaining open lists
    if (inOrderedList) formattedLines.push('</ol>');
    if (inUnorderedList) formattedLines.push('</ul>');
    
    return formattedLines.join('\n');
  }

  // Format links and emails
  formatLinks(content) {
    // Handle email links  
    content = content.replace(/\[([^\]]+)\]\(mailto:([^\)]+)\)/g, '<a href="mailto:$2" class="email-link">$1</a>');
    
    // Handle regular links
    content = content.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="response-link" target="_blank" rel="noopener">$1</a>');
    
    // Handle plain email addresses
    content = content.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="email-link">$1</a>');
    
    return content;
  }

  // FIXED: Format paragraphs with proper spacing
  formatParagraphs(content) {
    // Split by double newlines to create paragraphs
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // Don't wrap if it's already HTML
      if (paragraph.startsWith('<') || paragraph.includes('<li>') || paragraph.includes('<h')) {
        return paragraph;
      }
      
      // Handle single line breaks within paragraphs
      paragraph = paragraph.replace(/\n/g, '<br>');
      
      return `<p class="response-paragraph">${paragraph}</p>`;
    }).join('');
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  createMessageMeta(role, content) {
    const messageMeta = document.createElement('div');
    messageMeta.className = 'message-meta';

    // Always show timestamps
    const timestamp = document.createElement('span');
    timestamp.className = 'message-timestamp';
    const date = new Date();
    const timeStr = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    timestamp.textContent = `${timeStr}`;
    messageMeta.appendChild(timestamp);

    const messageActions = document.createElement('div');
    messageActions.className = 'message-actions';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'message-action';
    copyBtn.title = 'Copy message';
    copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;

    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const success = await this.copyToClipboard(content);
      if (success) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.disabled = true;
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        `;
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.disabled = false;
        }, 2000);
      }
    });

    messageActions.appendChild(copyBtn);

    // Regenerate button for bot messages
    if (role === 'bot') {
      const regenBtn = this.createActionButton('regenerate', 'Regenerate response', () => {
        this.regenerateLastResponse();
      });
      messageActions.appendChild(regenBtn);
    }

    messageMeta.appendChild(messageActions);
    return messageMeta;
  }

  createActionButton(type, title, onClick) {
    const button = document.createElement('button');
    button.className = 'message-action';
    button.title = title;
    button.addEventListener('click', onClick);
    
    const icons = {
      regenerate: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
        <path d="M21 3v5h-5"></path>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
        <path d="M3 21v-5h5"></path>
      </svg>`
    };
    
    button.innerHTML = icons[type] || '';
    return button;
  }

  regenerateLastResponse() {
    this.showToast('Regenerate', 'Feature coming soon!', 'info');
  }

  updateMessageContent(messageElement, content) {
    const bubble = messageElement.querySelector('.message-bubble');
    if (bubble) {
      bubble.innerHTML = this.formatBotMessage(content);
    }
  }

  addMessageToSession(role, content) {
    const session = this.state.sessions.get(this.state.currentSessionId);
    if (session) {
      session.messages.push({
        role: role,
        content: content,
        timestamp: new Date()
      });
      session.updatedAt = new Date();
      this.saveSessionsToStorage();
    }
  }

  // UI Helper Methods
  toggleSidebar() {
    this.state.sidebarOpen = !this.state.sidebarOpen;
    if (this.sidebar) {
      this.sidebar.classList.toggle('open', this.state.sidebarOpen);
    }
  }

  toggleTheme() {
    const themes = ['dark', 'light', 'auto'];
    const currentIndex = themes.indexOf(this.settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    this.updateSetting('theme', nextTheme);
    this.applyTheme();
  }

  showSettings() {
    if (this.settingsModal) {
      this.settingsModal.classList.add('show');
    }
  }

  hideSettings() {
    if (this.settingsModal) {
      this.settingsModal.classList.remove('show');
    }
  }

  showSearch() {
    if (this.searchModal) {
      this.searchModal.classList.add('show');
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.focus();
        }
      }, 100);
    }
  }

  hideSearch() {
    if (this.searchModal) {
      this.searchModal.classList.remove('show');
    }
  }

  hideModals() {
    this.hideSettings();
    this.hideSearch();
  }

  showToast(title, message, type = 'info') {
    if (!this.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">×</button>
    `;
    
    // Add click handler for close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    this.toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  showTypingIndicator() {
    this.state.isTyping = true;
    if (this.typingIndicator) {
      this.typingIndicator.classList.add('show');
    }
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.state.isTyping = false;
    if (this.typingIndicator) {
      this.typingIndicator.classList.remove('show');
    }
  }

  clearMessages() {
    if (this.chatMessages) {
      this.chatMessages.innerHTML = '';
    }
  }

  clearInput() {
    this.messageInput.value = '';
    this.autoResizeInput();
    this.updateSendButton();
    this.updateCharCounter();
    this.clearDraft();
  }

  focusInput() {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.focus();
      }
    }, 100);
  }

  autoResizeInput() {
    if (this.messageInput) {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
    }
  }

  updateSendButton() {
    if (this.sendBtn) {
      const hasText = this.messageInput.value.trim().length > 0;
      this.sendBtn.disabled = !hasText || this.state.isTyping || !this.state.isConnected;
    }
  }

  updateCharCounter() {
    if (this.charCounter) {
      const length = this.messageInput.value.length;
      this.charCounter.textContent = `${length}/2000`;
      this.charCounter.style.color = length > 1800 ? 'var(--accent-red)' : 'var(--text-muted)';
    }
  }

  scrollToBottom() {
    if (this.settings.autoScroll && this.chatMessages) {
      requestAnimationFrame(() => {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      });
    }
  }

  showWelcomeMessage() {
    if (this.welcomeMessage && !this.welcomeMessage.parentNode) {
      this.chatMessages.appendChild(this.welcomeMessage);
    }
  }

  // Session management helpers
  renderSessions() {
    if (!this.chatSessions) return;
    
    this.chatSessions.innerHTML = '';
    this.state.sessions.forEach((session, sessionId) => {
      const sessionElement = this.createSessionElement(session);
      this.chatSessions.appendChild(sessionElement);
    });
  }

  createSessionElement(session) {
    const element = document.createElement('div');
    element.className = `session-item ${session.id === this.state.currentSessionId ? 'active' : ''}`;
    element.dataset.sessionId = session.id;

    const timeStr = this.formatSessionTime(session.updatedAt);
    element.innerHTML = `
      <div class="session-content">
        <div class="session-title">${this.escapeHtml(session.title)}</div>
        <div class="session-time">${timeStr}</div>
      </div>
      <button class="session-delete" title="Delete session">×</button>
    `;

    return element;
  }

  formatSessionTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  }

  handleSessionClick(e) {
    const sessionItem = e.target.closest('.session-item');
    if (!sessionItem) return;

    const sessionId = sessionItem.dataset.sessionId;
    
    if (e.target.classList.contains('session-delete')) {
      e.stopPropagation();
      this.deleteSession(sessionId);
    } else {
      this.switchToSession(sessionId);
    }
  }

  deleteSession(sessionId) {
    if (this.state.sessions.size <= 1) {
      this.showToast('Cannot Delete', 'You must have at least one session', 'error');
      return;
    }

    this.state.sessions.delete(sessionId);
    
    if (this.state.currentSessionId === sessionId) {
      const firstSessionId = this.state.sessions.keys().next().value;
      this.switchToSession(firstSessionId);
    }
    
    this.renderSessions();
    this.saveSessionsToStorage();
    this.showToast('Session Deleted', 'Chat session has been deleted', 'info');
  }

  updateActiveSession(sessionId) {
    const sessionItems = this.chatSessions.querySelectorAll('.session-item');
    sessionItems.forEach(item => {
      item.classList.toggle('active', item.dataset.sessionId === sessionId);
    });
  }

  generateSessionTitle(message) {
    // Generate a title from the first message
    const words = message.split(' ');
    if (words.length <= 4) return message;
    return words.slice(0, 4).join(' ') + '...';
  }

  updateSessionTitle(sessionId, title) {
    const session = this.state.sessions.get(sessionId);
    if (session) {
      session.title = title;
      session.updatedAt = new Date();
      this.saveSessionsToStorage();
      this.renderSessions();
      
      if (sessionId === this.state.currentSessionId) {
        this.currentChatTitle.textContent = title;
      }
    }
  }

  // Settings and Storage
  loadSettings() {
    const savedSettings = localStorage.getItem('neuralai_settings');
    if (savedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    
    // Apply settings to UI controls
    if (this.themeSelect) this.themeSelect.value = this.settings.theme;
    if (this.streamingToggle) this.streamingToggle.checked = this.settings.streaming;
    if (this.autoScrollToggle) this.autoScrollToggle.checked = this.settings.autoScroll;
    if (this.timestampsToggle) this.timestampsToggle.checked = this.settings.showTimestamps;
    if (this.saveConversationsToggle) this.saveConversationsToggle.checked = this.settings.saveConversations;
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    localStorage.setItem('neuralai_settings', JSON.stringify(this.settings));
  }

  applyTheme() {
    let theme = this.settings.theme;
    
    if (theme === 'auto') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.body.className = `theme-${theme}`;
  }

  loadSessionsFromStorage() {
    if (!this.settings.saveConversations) return;
    
    const savedSessions = localStorage.getItem('neuralai_sessions');
    if (savedSessions) {
      try {
        const sessionsData = JSON.parse(savedSessions);
        Object.entries(sessionsData).forEach(([id, session]) => {
          this.state.sessions.set(id, {
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt)
          });
        });
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    }
  }

  saveSessionsToStorage() {
    if (!this.settings.saveConversations) return;
    
    const sessionsData = {};
    this.state.sessions.forEach((session, id) => {
      sessionsData[id] = session;
    });
    
    localStorage.setItem('neuralai_sessions', JSON.stringify(sessionsData));
  }

  setConnectionState(state, message = '') {
    this.state.isConnected = state === 'connected';

    if (this.statusDot) {
      this.statusDot.className = 'status-dot';
      if (state === 'connecting') this.statusDot.classList.add('connecting');
      if (state === 'error') this.statusDot.classList.add('error');
    }

    if (this.statusText) {
      if (state === 'connected') {
        this.statusText.textContent = 'Connected';
      } else if (state === 'connecting') {
        this.statusText.textContent = 'Connecting...';
      } else {
        this.statusText.textContent = message || 'Offline';
      }
    }
  }

  async checkConnection() {
    this.setConnectionState('connecting');

    try {
      const response = await fetch(`${this.apiConfig.baseUrl}${this.apiConfig.endpoints.status}`);
      const data = await response.json();

      const isConnected = response.ok && data.status !== 'error' && data.connected !== false;
      this.setConnectionState(isConnected ? 'connected' : 'error', isConnected ? '' : 'Offline');
      return isConnected;
    } catch (error) {
      console.error('Status check failed:', error);
      this.setConnectionState('error', 'Offline');
      return false;
    }
  }

  // Draft functionality
  saveDraft() {
    const draft = this.messageInput.value;
    localStorage.setItem('neuralai_draft', draft);
  }

  loadDraft() {
    const draft = localStorage.getItem('neuralai_draft');
    if (draft && !this.messageInput.value) {
      this.messageInput.value = draft;
      this.autoResizeInput();
      this.updateCharCounter();
      this.updateSendButton();
    }
  }

  clearDraft() {
    localStorage.removeItem('neuralai_draft');
  }

  // Export and clear functionality
  exportCurrentChat() {
    const session = this.state.sessions.get(this.state.currentSessionId);
    if (!session) return;

    const chatData = {
      title: session.title,
      messages: session.messages,
      exportedAt: new Date()
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chat.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('Export Complete', 'Chat has been exported as JSON', 'success');
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  }

  performSearch(query) {
    // Placeholder for search functionality
    if (this.searchResults) {
      this.searchResults.innerHTML = `<div class="search-result">Search for "${query}" - Coming soon!</div>`;
    }
  }
}

// Initialize the enhanced chatbot
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new EnhancedChatbot();
});
