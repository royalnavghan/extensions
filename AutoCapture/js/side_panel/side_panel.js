/**
 * Text Analyzer Extension Side Panel Script
 * @author Santhosh Kumar Reddy
 * @license MIT
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
  const captureTextBtn = document.getElementById('captureText');
  const aiModelSelect = document.getElementById('aiModel');
  const capturedTextElement = document.getElementById('capturedText');
  const aiResponseElement = document.getElementById('aiResponse');
  const statusMessage = document.getElementById('statusMessage');
  const loader = document.getElementById('loader');
  const settingsBtn = document.getElementById('settingsBtn');
  const themeToggleBtn = document.getElementById('themeToggle');
  const historyBtn = document.getElementById('historyBtn');
  const mainView = document.getElementById('mainView');
  const settingsView = document.getElementById('settingsView');
  const historyView = document.getElementById('historyView');
  const clearTextBtn = document.getElementById('clearText');
  const clearResponseBtn = document.getElementById('clearResponse');
  const splitViewToggleBtn = document.getElementById('splitViewToggle');
  const contentArea = document.getElementById('contentArea');
  const copyTextBtn = document.getElementById('copyText');
  const copyResponseBtn = document.getElementById('copyResponse');
  const stepOCR = document.getElementById('stepOCR');
  const stepAI = document.getElementById('stepAI');
  const switchToFullscreenBtn = document.getElementById('switchToFullscreen');
  const expandToFullScreenBtn = document.getElementById('expandToFullScreen');
  
  const tabButtons = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  const chatgptApiKeyInput = document.getElementById('chatgptApiKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const telegramBotTokenInput = document.getElementById('telegramBotToken');
  const telegramChatIdInput = document.getElementById('telegramChatId');
  const doNotStoreKeysCheckbox = document.getElementById('doNotStoreKeys');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const cancelSettingsBtn = document.getElementById('cancelSettings');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  const sidePanelModeRadio = document.getElementById('sidePanelMode');
  const fullScreenModeRadio = document.getElementById('fullScreenMode');
  const rememberLastModeCheckbox = document.getElementById('rememberLastMode');
  const testTelegramConnectionBtn = document.getElementById('testTelegramConnection');
  const telegramTestResult = document.getElementById('telegramTestResult');
  const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
  
  const historyEntriesContainer = document.getElementById('historyEntries');
  const backToMainBtn = document.getElementById('backToMain');
  const exportHistoryBtn = document.getElementById('exportHistory');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageIndicator = document.getElementById('pageIndicator');
  const filterButtons = document.querySelectorAll('.btn-filter');
  
  let sessionKeys = {
    chatgptApiKey: '',
    geminiApiKey: '',
    telegramBotToken: '',
    telegramChatId: ''
  };
  
  let historyEntries = [];
  let currentPage = 1;
  let activeFilter = 'all';
  const entriesPerPage = 5;
  
  const textModeToggle = document.getElementById('textModeToggle');
  let currentText = '';
  let sanitizedText = null;
  let lastProcessedText = '';
  
  let autoCaptureActive = false;
  let captureInterval = null;
  let selectedTabId = null;
  
  initializeExtension();
  initializeAutoCapture();
  
  if (tabButtons && tabButtons.length > 0) {
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        tabButtons.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        this.classList.add('active');
        const targetId = this.getAttribute('data-target');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active');
          if (targetId === 'historyTab') {
            renderHistoryEntries();
          }
        }
      });
    });
  }
  
  if (captureTextBtn) captureTextBtn.addEventListener('click', captureAndProcess);
  if (aiModelSelect) aiModelSelect.addEventListener('change', () => chrome.storage.local.set({selectedModel: aiModelSelect.value}));
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  if (settingsBtn) settingsBtn.addEventListener('click', () => showView(settingsView));
  if (historyBtn) historyBtn.addEventListener('click', () => {
    renderHistoryEntries();
    showView(historyView);
  });
  if (backToMainBtn) backToMainBtn.addEventListener('click', () => showView(mainView));
  if (exportHistoryBtn) exportHistoryBtn.addEventListener('click', exportHistory);
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all history entries? This cannot be undone.')) {
      clearAllHistory();
    }
  });
  if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderHistoryEntries();
    }
  });
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(getFilteredHistory().length / entriesPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderHistoryEntries();
    }
  });
  
  if (filterButtons) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        if (this.id === 'filterAll') {
          activeFilter = 'all';
        } else if (this.id === 'filterManual') {
          activeFilter = 'manual';
        } else if (this.id === 'filterAuto') {
          activeFilter = 'auto';
        }
        currentPage = 1;
        renderHistoryEntries();
      });
    });
  }
  
  if (togglePasswordBtns) {
    togglePasswordBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
          const eyeIcon = this.querySelector('.eye-icon');
          if (eyeIcon) eyeIcon.classList.toggle('eye-icon-hidden');
        }
      });
    });
  }
  
  if (settingsTabBtns) {
    settingsTabBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        settingsTabBtns.forEach(tab => tab.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.settings-tab-content').forEach(content => {
          content.classList.remove('active');
        });
        const targetTab = this.getAttribute('data-target');
        const targetElement = document.getElementById(targetTab);
        if (targetElement) targetElement.classList.add('active');
      });
    });
  }
  
  if (switchToFullscreenBtn) {
    switchToFullscreenBtn.addEventListener('click', switchToFullscreen);
  }
  
  if (expandToFullScreenBtn) {
    expandToFullScreenBtn.addEventListener('click', switchToFullscreen);
  }
  
  if (sidePanelModeRadio) sidePanelModeRadio.addEventListener('change', updateDisplayMode);
  if (fullScreenModeRadio) fullScreenModeRadio.addEventListener('change', updateDisplayMode);
  
  if (testTelegramConnectionBtn) testTelegramConnectionBtn.addEventListener('click', testTelegramConnection);
  
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
  if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', () => showView(mainView));
  if (clearTextBtn) clearTextBtn.addEventListener('click', clearText);
  if (clearResponseBtn) clearResponseBtn.addEventListener('click', clearResponse);
  if (splitViewToggleBtn) splitViewToggleBtn.addEventListener('click', toggleSplitView);
  if (copyTextBtn) copyTextBtn.addEventListener('click', () => copyToClipboard(capturedTextElement));
  if (copyResponseBtn) copyResponseBtn.addEventListener('click', () => copyToClipboard(aiResponseElement));
  if (textModeToggle) textModeToggle.addEventListener('change', toggleTextMode);
  
  function switchToFullscreen() {
    chrome.storage.local.set({displayMode: 'fullScreen'}, () => {
      chrome.tabs.create({url: chrome.runtime.getURL('fullscreen.html')});
    });
  }
  
  function updateDisplayMode() {
    const mode = document.querySelector('input[name="displayMode"]:checked').value;
    if (mode && rememberLastModeCheckbox) {
      chrome.storage.local.set({
        displayMode: mode,
        rememberLastMode: rememberLastModeCheckbox.checked
      });
      if (mode === 'fullScreen') {
        switchToFullscreen();
      }
    }
  }
  
  function getFilteredHistory() {
    if (activeFilter === 'all') {
      return historyEntries;
    } else {
      return historyEntries.filter(entry => entry.type === activeFilter);
    }
  }
  
  function toggleSplitView() {
    contentArea.classList.toggle('standard-view');
    contentArea.classList.toggle('split-view');
    chrome.storage.local.set({
      splitView: contentArea.classList.contains('split-view')
    });
  }
  
  function toggleTextMode() {
    const textModeToggle = document.getElementById('textModeToggle');
    const capturedTextElement = document.getElementById('capturedText');
    if (textModeToggle.checked && sanitizedText) {
      capturedTextElement.textContent = sanitizedText;
    } else {
      capturedTextElement.textContent = currentText;
    }
  }
  
  function copyToClipboard(element) {
    const text = element.innerText;
    if (text && !text.includes('will appear here')) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setStatus('Copied to clipboard');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          setStatus('Failed to copy text');
        });
    }
  }
  
  function showView(viewToShow) {
    if (!viewToShow) {
      console.error('Attempted to show a view that does not exist');
      return;
    }
    if (mainView) mainView.classList.add('hidden');
    if (settingsView) settingsView.classList.add('hidden');
    if (historyView) historyView.classList.add('hidden');
    viewToShow.classList.remove('hidden');
  }
  
  function initializeExtension() {
    loadThemePreference();
    loadSettings();
    loadHistory();
    loadStoredContent();
    const activeFilterButton = document.getElementById('filterAll');
    if (activeFilterButton) {
      activeFilterButton.classList.add('active');
    }
    setStatus('Ready');
  }
  
  function loadStoredContent() {
    chrome.storage.local.get(['capturedText', 'aiResponse', 'selectedModel', 'sanitizedText'], function(result) {
      if (result.capturedText && capturedTextElement) {
        currentText = result.capturedText;
        displayRawText();
      }
      if (result.sanitizedText) {
        sanitizedText = result.sanitizedText;
        if (textModeToggle && textModeToggle.checked) {
          displaySanitizedText();
        }
      }
      if (result.aiResponse && aiResponseElement) {
        try {
          aiResponseElement.innerHTML = displayFormattedResponse(result.aiResponse);
          if (stepOCR) stepOCR.className = 'process-step success';
          if (stepAI) stepAI.className = 'process-step success';
        } catch (err) {
          console.error('Error displaying stored AI response:', err);
          aiResponseElement.innerHTML = '<div class="placeholder">Error loading stored AI response</div>';
        }
      } else if (aiResponseElement) {
        aiResponseElement.innerHTML = '<div class="placeholder">AI response will appear here</div>';
      }
      if (result.selectedModel && aiModelSelect) {
        aiModelSelect.value = result.selectedModel;
      }
    });
  }
  
  function loadSettings() {
    chrome.storage.local.get([
      'chatgptApiKey', 
      'geminiApiKey', 
      'doNotStoreKeys', 
      'telegramBotToken', 
      'telegramChatId',
      'displayMode',
      'rememberLastMode'
    ], function(result) {
      if (!result.doNotStoreKeys) {
        if (result.chatgptApiKey && chatgptApiKeyInput) {
          chatgptApiKeyInput.value = result.chatgptApiKey;
          sessionKeys.chatgptApiKey = result.chatgptApiKey;
        }
        if (result.geminiApiKey && geminiApiKeyInput) {
          geminiApiKeyInput.value = result.geminiApiKey;
          sessionKeys.geminiApiKey = result.geminiApiKey;
        }
        if (result.telegramBotToken && telegramBotTokenInput) {
          telegramBotTokenInput.value = result.telegramBotToken;
          sessionKeys.telegramBotToken = result.telegramBotToken;
        }
        if (result.telegramChatId && telegramChatIdInput) {
          telegramChatIdInput.value = result.telegramChatId;
          sessionKeys.telegramChatId = result.telegramChatId;
        }
      }
      if (doNotStoreKeysCheckbox) {
        doNotStoreKeysCheckbox.checked = result.doNotStoreKeys || false;
      }
      if (result.displayMode) {
        if (sidePanelModeRadio && fullScreenModeRadio) {
          if (result.displayMode === 'fullScreen') {
            fullScreenModeRadio.checked = true;
            sidePanelModeRadio.checked = false;
          } else {
            sidePanelModeRadio.checked = true;
            fullScreenModeRadio.checked = false;
          }
        }
      }
      if (rememberLastModeCheckbox) {
        rememberLastModeCheckbox.checked = result.rememberLastMode || false;
      }
    });
  }
  
  function saveSettings() {
    if (!chatgptApiKeyInput || !geminiApiKeyInput || !doNotStoreKeysCheckbox) {
      console.error('Required settings elements not found');
      return;
    }
    
    const settings = {};
    const chatgptKey = chatgptApiKeyInput.value.trim();
    const geminiKey = geminiApiKeyInput.value.trim();
    const telegramToken = telegramBotTokenInput ? telegramBotTokenInput.value.trim() : '';
    const telegramChat = telegramChatIdInput ? telegramChatIdInput.value.trim() : '';
    const doNotStore = doNotStoreKeysCheckbox.checked;
    
    const displayMode = document.querySelector('input[name="displayMode"]:checked')?.value || 'sidePanel';
    const rememberLastMode = rememberLastModeCheckbox ? rememberLastModeCheckbox.checked : false;
    
    settings.displayMode = displayMode;
    settings.rememberLastMode = rememberLastMode;
    settings.doNotStoreKeys = doNotStore;
    
    if (!doNotStore) {
      if (chatgptKey) settings.chatgptApiKey = chatgptKey;
      if (geminiKey) settings.geminiApiKey = geminiKey;
      if (telegramToken) settings.telegramBotToken = telegramToken;
      if (telegramChat) settings.telegramChatId = telegramChat;
    }
    
    sessionKeys.chatgptApiKey = chatgptKey;
    sessionKeys.geminiApiKey = geminiKey;
    sessionKeys.telegramBotToken = telegramToken;
    sessionKeys.telegramChatId = telegramChat;
    
    chrome.storage.local.set(settings, function() {
      setStatus('Settings saved');
      const mainTabButton = document.querySelector('.tab[data-target="mainTab"]');
      if (mainTabButton) {
        mainTabButton.click();
      }
      setTimeout(() => {
        setStatus('Ready');
      }, 2000);
    });
  }
  
  function processWithAI(text, model, apiKey, callback) {
    setStatus('Processing with AI...');
    updateStepStatus(stepAI, 'processing', 'Processing');
    
    chrome.runtime.sendMessage({
      action: 'processText',
      text: text,
      model: model,
      apiKey: apiKey
    }, function(response) {
      if (response.error) {
        handleError('AI processing failed', response.error);
        updateStepStatus(stepAI, 'error', 'Failed');
        callback(null);
      } else {
        updateStepStatus(stepAI, 'success', 'Complete');
        callback(response.text);
      }
    });
  }
  
  function displayFormattedResponse(responseText) {
    if (!responseText) return '';
    
    try {
      if (typeof marked !== 'undefined') {
        marked.setOptions({
          gfm: true,
          breaks: true,
          smartLists: true,
          smartypants: true
        });
        
        let formattedHtml = marked.parse(responseText);
        formattedHtml = formattedHtml.replace(/^([A-D]\.\s.+?)(?=<\/p>|$)/m, '<div class="answer-choice">$1</div>');
        formattedHtml = formattedHtml.replace(/<h3>Explanation:<\/h3>/i, '<h3 class="explanation-header">Explanation:</h3>');
        
        return formattedHtml;
      } else {
        console.warn('Marked library not available, showing plain text');
        return `<pre>${escapeHTML(responseText)}</pre>`;
      }
    } catch (error) {
      console.error('Error formatting response:', error);
      return `<pre>${escapeHTML(responseText)}</pre>`;
    }
  }
  
  async function extractTextFromImage(imageUrl, callback) {
    try {
      updateStepStatus(stepOCR, 'processing', 'Processing');
      setStatus('Extracting text from image...');
      
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      
      image.onload = async function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        const model = aiModelSelect.value;
        if (model.startsWith('gemini')) {
          const apiKey = sessionKeys.geminiApiKey;
          if (!apiKey) {
            handleError('API Key Required', 'Please set your Gemini API key in settings');
            updateStepStatus(stepOCR, 'error', 'Failed');
            return callback(null);
          }
          
          chrome.runtime.sendMessage({
            action: 'callGeminiWithImage',
            imageBase64: imageDataUrl,
            apiKey: apiKey,
            modelType: model
          }, function(response) {
            if (response.error) {
              handleError('OCR failed', response.error);
              updateStepStatus(stepOCR, 'error', 'Failed');
              callback(null);
            } else {
              updateStepStatus(stepOCR, 'success', 'Complete');
              callback(response.text);
            }
          });
        } else {
          updateStepStatus(stepOCR, 'error', 'Failed - Use Gemini');
          handleError('OCR Method', 'Please use Gemini for image processing');
          callback(null);
        }
      };
      
      image.onerror = function() {
        updateStepStatus(stepOCR, 'error', 'Failed');
        handleError('Image Load Error', 'Could not load the screenshot');
        callback(null);
      };
      
      image.src = imageUrl;
      
    } catch (error) {
      console.error('Error in extractTextFromImage:', error);
      updateStepStatus(stepOCR, 'error', 'Failed');
      handleError('OCR Error', error.message);
      callback(null);
    }
  }
  
  function sanitizeQuestionText(text) {
    if (!text) return '';
    
    let sanitized = text.trim();
    sanitized = sanitized.replace(/\s+/g, ' ');
    sanitized = sanitized.replace(/[^\p{L}\p{N}\p{P}\s]/gu, '');
    sanitized = sanitized.replace(/(\r\n|\n|\r)+/g, '\n');
    sanitized = sanitized.replace(/\.{2,}/g, '.');
    sanitized = sanitized.split('\n').map(line => line.trim()).join('\n');
    
    return sanitized;
  }
  
  function formatHistoryEntry(question, options, aiResponse) {
    return {
      timestamp: new Date().toISOString(),
      model: options.model,
      rawText: question,
      sanitizedText: options.sanitizedText,
      aiResponse: aiResponse,
      type: 'manual',
      sentToTelegram: false
    };
  }
  
  function captureAndProcess() {
    setStatus('Preparing to capture screen...');
    showHapticFeedback('start');
    
    updateStepStatus(stepOCR, 'waiting', 'Waiting');
    updateStepStatus(stepAI, 'waiting', 'Waiting');
    
    chrome.tabs.captureVisibleTab({ format: 'png' }, function(screenshotUrl) {
      if (chrome.runtime.lastError) {
        handleError('Capture failed', chrome.runtime.lastError.message);
        return;
      }
      
      extractTextFromImage(screenshotUrl, function(extractedText) {
        if (extractedText) {
          processExtractedText(extractedText);
        } else {
          setStatus('Text extraction failed');
          showHapticFeedback('error');
        }
      });
    });
  }
  
  function processExtractedText(text) {
    if (!text) {
      handleError('Processing Error', 'No text was extracted from the image');
      return;
    }
    
    setStatus('Text extracted successfully');
    
    currentText = text;
    chrome.storage.local.set({capturedText: text});
    
    sanitizedText = sanitizeQuestionText(text);
    chrome.storage.local.set({sanitizedText: sanitizedText});
    
    if (textModeToggle && textModeToggle.checked) {
      displaySanitizedText();
    } else {
      displayRawText();
    }
    
    const model = aiModelSelect ? aiModelSelect.value : 'chatgpt';
    let apiKey = '';
    
    if (model === 'chatgpt') {
      apiKey = sessionKeys.chatgptApiKey;
    } else if (model.startsWith('gemini')) {
      apiKey = sessionKeys.geminiApiKey;
    }
    
    if (!apiKey) {
      const provider = model === 'chatgpt' ? 'OpenAI' : 'Gemini';
      handleError('API Key Required', `Please set your ${provider} API key in settings`);
      return;
    }
    
    processWithAI(sanitizedText, model, apiKey, function(response) {
      if (response) {
        if (aiResponseElement) {
          aiResponseElement.innerHTML = displayFormattedResponse(response);
        }
        
        chrome.storage.local.set({aiResponse: response});
        
        const entry = formatHistoryEntry(currentText, {
          model: model,
          sanitizedText: sanitizedText
        }, response);
        
        historyEntries.unshift(entry);
        chrome.storage.local.set({history: historyEntries});
        
        setStatus('Processing complete');
        showHapticFeedback('success');
        
        lastProcessedText = text;
      } else {
        setStatus('AI processing failed');
        showHapticFeedback('error');
      }
    });
  }
  
  function showHapticFeedback(type) {
    if (!navigator.vibrate) return;
    
    switch (type) {
      case 'start':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([30, 20, 50]);
        break;
      case 'error':
        navigator.vibrate([50, 30, 50, 30, 50]);
        break;
      default:
        navigator.vibrate(30);
    }
  }
  
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    chrome.storage.local.set({theme: newTheme}, () => {
      chrome.runtime.sendMessage({
        action: 'themeChanged',
        theme: newTheme
      });
    });
  }
  
  function loadThemePreference() {
    chrome.storage.local.get(['theme'], function(result) {
      const theme = result.theme || 'light';
      document.documentElement.setAttribute('data-theme', theme);
    });
  }
  
  function loadHistory() {
    chrome.storage.local.get(['history'], function(result) {
      if (result.history && Array.isArray(result.history)) {
        historyEntries = result.history;
      }
    });
  }
  
  function renderHistoryEntries() {
    const filteredEntries = getFilteredHistory();
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = Math.min(startIndex + entriesPerPage, filteredEntries.length);
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
    
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    
    if (filteredEntries.length === 0) {
      historyEntriesContainer.innerHTML = `
        <div class="empty-history-message">
          <span class="fa-icon fa-icon-history empty-icon" style="width: 48px; height: 48px;"></span>
          <p>No history entries yet. Capture some text to get started!</p>
        </div>
      `;
      return;
    }
    
    let entriesHTML = '';
    
    for (let i = startIndex; i < endIndex; i++) {
      const entry = filteredEntries[i];
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleString();
      const displayText = entry.sanitizedText || entry.rawText;
      const truncatedQuestion = truncateText(displayText, 100);
      const truncatedResponse = truncateText(entry.aiResponse, 100);
      const entryTypeIcon = entry.type === 'auto' ? 'fa-icon-sync' : 'fa-icon-camera';
      const entryTypeBadge = entry.type === 'auto' ? 'auto-capture-badge' : '';
      const telegramBadge = entry.sentToTelegram ? '<span class="telegram-badge"><span class="fa-icon fa-icon-paper-plane"></span></span>' : '';
      
      entriesHTML += `
        <div class="history-entry ${entryTypeBadge}">
          <div class="entry-header">
            <div class="entry-info">
              <span class="entry-time">${formattedDate}</span>
              <span class="entry-model">${entry.model}</span>
              ${telegramBadge}
            </div>
            <div class="entry-actions">
              <button class="entry-action-btn entry-expand-btn" data-index="${i}">
                <span class="fa-icon fa-icon-chevron-down"></span>
              </button>
            </div>
          </div>
          
          <div class="entry-content">
            <div class="entry-question-preview entry-section">
              <div class="entry-label">
                <span class="fa-icon ${entryTypeIcon}"></span>
                <span>Extracted Text</span>
              </div>
              <div class="entry-text preview">${escapeHTML(truncatedQuestion)}</div>
            </div>
            
            <div class="entry-response-preview entry-section">
              <div class="entry-label">
                <span class="fa-icon fa-icon-robot"></span>
                <span>AI Response</span>
              </div>
              <div class="entry-text preview">${escapeHTML(truncatedResponse)}</div>
            </div>
          </div>
          
          <div class="entry-details hidden">
            <div class="entry-full-question entry-section">
              <div class="entry-label">Full Text</div>
              <div class="entry-text full">
                <pre>${escapeHTML(displayText)}</pre>
              </div>
              <button class="copy-entry-btn" data-content="question" data-index="${i}">
                <span class="fa-icon fa-icon-copy"></span> Copy
              </button>
            </div>
            
            <div class="entry-full-response entry-section">
              <div class="entry-label">Full Response</div>
              <div class="entry-text full markdown-content">
                ${marked.parse(entry.aiResponse)}
              </div>
              <button class="copy-entry-btn" data-content="response" data-index="${i}">
                <span class="fa-icon fa-icon-copy"></span> Copy
              </button>
            </div>
            
            <div class="entry-actions-full">
              <button class="entry-delete-btn" data-index="${i}">
                <span class="fa-icon fa-icon-trash"></span> Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    historyEntriesContainer.innerHTML = entriesHTML;
    
    const expandButtons = document.querySelectorAll('.entry-expand-btn');
    expandButtons.forEach(btn => btn.addEventListener('click', toggleExpand));
    
    const copyButtons = document.querySelectorAll('.copy-entry-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        const contentType = this.getAttribute('data-content');
        const entry = filteredEntries[index];
        
        let textToCopy = '';
        if (contentType === 'question') {
          textToCopy = entry.sanitizedText || entry.rawText;
        } else if (contentType === 'response') {
          textToCopy = entry.aiResponse;
        }
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="fa-icon fa-icon-check"></span>';
            setTimeout(() => {
              this.innerHTML = originalText;
            }, 1500);
          })
          .catch(err => console.error('Copy failed:', err));
      });
    });
    
    const deleteButtons = document.querySelectorAll('.entry-delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        if (confirm('Are you sure you want to delete this entry?')) {
          historyEntries.splice(startIndex + index, 1);
          chrome.storage.local.set({history: historyEntries}, () => {
            renderHistoryEntries();
          });
        }
      });
    });
    
    function toggleExpand() {
      const index = parseInt(this.getAttribute('data-index'));
      const entry = document.querySelectorAll('.history-entry')[index - startIndex];
      const detailsSection = entry.querySelector('.entry-details');
      
      detailsSection.classList.toggle('hidden');
      
      if (detailsSection.classList.contains('hidden')) {
        this.innerHTML = '<span class="fa-icon fa-icon-chevron-down"></span>';
      } else {
        this.innerHTML = '<span class="fa-icon fa-icon-chevron-up"></span>';
      }
    }
  }
  
  function exportHistory() {
    if (historyEntries.length === 0) {
      alert('No history entries to export');
      return;
    }
    
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      entries: historyEntries
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "text_analyzer_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
  
  function clearAllHistory() {
    historyEntries = [];
    chrome.storage.local.set({history: historyEntries}, function() {
      renderHistoryEntries();
      setStatus('History cleared');
      setTimeout(() => {
        setStatus('Ready');
      }, 2000);
    });
  }
  
  function setStatus(message) {
    statusMessage.textContent = message;
  }
  
  function updateStepStatus(stepElement, statusClass, text) {
    if (!stepElement) return;
    
    if (statusClass === 'waiting') {
      stepElement.className = 'process-step idle';
    } else if (statusClass === 'processing') {
      stepElement.className = 'process-step in-progress';
    } else if (statusClass === 'success') {
      stepElement.className = 'process-step complete';
    } else if (statusClass === 'error') {
      stepElement.className = 'process-step error';
    } else {
      stepElement.className = 'process-step ' + statusClass;
    }
    
    if (text) {
      stepElement.textContent = text;
    }
  }
  
  function handleError(message, details) {
    console.error(`${message}: ${details}`);
    setStatus(`Error: ${message}`);
    showHapticFeedback('error');
  }
  
  function displayRawText() {
    if (!currentText) {
      capturedTextElement.innerHTML = '<p class="placeholder">Captured text will appear here</p>';
      return;
    }
    
    capturedTextElement.innerHTML = `<pre>${escapeHTML(currentText)}</pre>`;
  }
  
  function displaySanitizedText() {
    if (!sanitizedText) {
      if (currentText) {
        sanitizedText = sanitizeQuestionText(currentText);
        chrome.storage.local.set({sanitizedText: sanitizedText});
      } else {
        capturedTextElement.innerHTML = '<p class="placeholder">Captured text will appear here</p>';
        return;
      }
    }
    
    capturedTextElement.innerHTML = formatSanitizedText(sanitizedText);
  }
  
  function formatSanitizedText(text) {
    if (!text) return '';
    return `<pre>${escapeHTML(text)}</pre>`;
  }
  
  function clearText() {
    currentText = '';
    sanitizedText = null;
    capturedTextElement.innerHTML = '<p class="placeholder">Captured text will appear here</p>';
    chrome.storage.local.remove(['capturedText', 'sanitizedText']);
  }
  
  function clearResponse() {
    aiResponseElement.innerHTML = '<p class="placeholder">AI response will appear here</p>';
    chrome.storage.local.remove(['aiResponse']);
  }
  
  function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  function initializeAutoCapture() {
    const autoCaptureToggle = document.getElementById('autoCaptureToggle');
    const startAutoCaptureBtn = document.getElementById('startAutoCapture');
    const stopAutoCaptureBtn = document.getElementById('stopAutoCapture');
    
    if (autoCaptureToggle) {
      autoCaptureToggle.addEventListener('change', function() {
        const isEnabled = this.checked;
        updateAutoCaptureUI(isEnabled);
      });
    }
    
    if (startAutoCaptureBtn) {
      startAutoCaptureBtn.addEventListener('click', startAutoCapture);
    }
    
    if (stopAutoCaptureBtn) {
      stopAutoCaptureBtn.addEventListener('click', stopAutoCapture);
    }
    
    populateTabList();
  }

  function updateAutoCaptureUI(isEnabled) {
    const captureTabSelect = document.getElementById('captureTabSelect');
    const intervalInput = document.getElementById('captureInterval');
    const autoCaptureModel = document.getElementById('autoCaptureModel');
    const startAutoCaptureBtn = document.getElementById('startAutoCapture');
    
    if (captureTabSelect) captureTabSelect.disabled = !isEnabled;
    if (intervalInput) intervalInput.disabled = !isEnabled;
    if (autoCaptureModel) autoCaptureModel.disabled = !isEnabled;
    if (startAutoCaptureBtn) startAutoCaptureBtn.disabled = !isEnabled;
    
    document.getElementById('autoCaptureStatus').textContent = isEnabled ? 'Enabled' : 'Disabled';
  }

  function populateTabList() {
    chrome.tabs.query({}, function(tabs) {
      const captureTabSelect = document.getElementById('captureTabSelect');
      if (!captureTabSelect) return;
      
      captureTabSelect.innerHTML = '<option value="">Select a tab to capture</option>';
      
      tabs.forEach(function(tab) {
        const option = document.createElement('option');
        option.value = tab.id;
        option.textContent = tab.title;
        captureTabSelect.appendChild(option);
      });
    });
  }

  function startAutoCapture() {
    const intervalInput = document.getElementById('captureInterval');
    const captureTabSelect = document.getElementById('captureTabSelect');
    
    if (!intervalInput || !captureTabSelect || !captureTabSelect.value) {
      setStatus('Please select a tab and set interval', 'error');
      return;
    }
    
    selectedTabId = parseInt(captureTabSelect.value);
    const intervalSeconds = parseInt(intervalInput.value);
    
    if (intervalSeconds < 5) {
      setStatus('Interval must be at least 5 seconds', 'error');
      return;
    }
    
    autoCaptureActive = true;
    document.getElementById('startAutoCapture').classList.add('hidden');
    document.getElementById('stopAutoCapture').classList.remove('hidden');
    
    performAutoCapture();
    captureInterval = setInterval(performAutoCapture, intervalSeconds * 1000);
    
    setStatus('Auto capture started', 'success');
  }

  function stopAutoCapture() {
    autoCaptureActive = false;
    if (captureInterval) {
      clearInterval(captureInterval);
      captureInterval = null;
    }
    
    document.getElementById('startAutoCapture').classList.remove('hidden');
    document.getElementById('stopAutoCapture').classList.add('hidden');
    
    setStatus('Auto capture stopped', 'info');
  }

  function performAutoCapture() {
    if (!selectedTabId || !autoCaptureActive) return;
    
    chrome.tabs.sendMessage(selectedTabId, { action: 'extractText' }, function(response) {
      if (chrome.runtime.lastError) {
        setStatus('Failed to capture text: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      
      if (response && response.success) {
        const extractedText = response.selectedText || response.visibleText || response.bodyText;
        if (extractedText) {
          currentText = extractedText;
          sanitizedText = sanitizeQuestionText(extractedText);
          
          const textModeToggle = document.getElementById('textModeToggle');
          if (textModeToggle && textModeToggle.checked) {
            document.getElementById('capturedText').textContent = sanitizedText;
          } else {
            document.getElementById('capturedText').textContent = currentText;
          }
          
          processWithAI();
        }
      }
    });
  }
});