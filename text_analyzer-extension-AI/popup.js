/**
 * Text Analyzer Extension Popup Script
 * @author Santhosh Kumar Reddy
 * @license MIT
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
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
  
  // Settings elements
  const chatgptApiKeyInput = document.getElementById('chatgptApiKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const doNotStoreKeysCheckbox = document.getElementById('doNotStoreKeys');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const cancelSettingsBtn = document.getElementById('cancelSettings');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  
  // History elements
  const historyEntriesContainer = document.getElementById('historyEntries');
  const backToMainBtn = document.getElementById('backToMain');
  const exportHistoryBtn = document.getElementById('exportHistory');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageIndicator = document.getElementById('pageIndicator');
  
  let sessionKeys = {
    chatgptApiKey: '',
    geminiApiKey: ''
  };
  
  let historyEntries = [];
  let currentPage = 1;
  const entriesPerPage = 10;
  
  const textModeToggle = document.getElementById('textModeToggle');
  let currentText = '';
  let sanitizedText = null;
  let lastProcessedText = '';
  
  initializeExtension();
  
  // Event Listeners
  captureTextBtn.addEventListener('click', captureAndProcess);
  aiModelSelect.addEventListener('change', () => chrome.storage.local.set({selectedModel: aiModelSelect.value}));
  themeToggleBtn.addEventListener('click', toggleTheme);
  settingsBtn.addEventListener('click', () => showView(settingsView));
  historyBtn.addEventListener('click', () => {
    renderHistoryEntries();
    showView(historyView);
  });
  backToMainBtn.addEventListener('click', () => showView(mainView));
  exportHistoryBtn.addEventListener('click', exportHistory);
  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all history entries? This cannot be undone.')) {
      clearAllHistory();
    }
  });
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderHistoryEntries();
    }
  });
  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(historyEntries.length / entriesPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderHistoryEntries();
    }
  });
  
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
      this.querySelector('.eye-icon').classList.toggle('eye-icon-hidden');
    });
  });
  
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', () => showView(mainView));
  
  clearTextBtn.addEventListener('click', function() {
    clearText();
  });
  
  clearResponseBtn.addEventListener('click', function() {
    aiResponseElement.innerHTML = '<p class="placeholder">AI response will appear here</p>';
    updateStepStatus(stepAI, 'waiting', 'Waiting');
    chrome.storage.local.remove('aiResponse', function() {
      setStatus('Response cleared');
    });
  });
  
  splitViewToggleBtn.addEventListener('click', toggleSplitView);
  
  copyTextBtn.addEventListener('click', function() {
    copyToClipboard(capturedTextElement);
    showCopyFeedback(this);
    showHapticFeedback('success');
  });
  
  copyResponseBtn.addEventListener('click', function() {
    copyToClipboard(aiResponseElement);
    showCopyFeedback(this);
    showHapticFeedback('success');
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.shiftKey) {
      switch(e.key) {
        case 'T': captureAndProcess(); break;
        case 'S': toggleSplitView(); break;
        case 'H': 
          renderHistoryEntries();
          showView(historyView);
          break;
        case 'G': showView(settingsView); break;
      }
    }
    if (e.key === 'Escape' && (historyView.style.display !== 'none' || settingsView.style.display !== 'none')) {
      showView(mainView);
    }
  });

  textModeToggle.addEventListener('change', function() {
    if (this.checked) {
      capturedTextElement.classList.remove('raw-mode');
      capturedTextElement.classList.add('sanitized-mode');
      displaySanitizedText();
      chrome.storage.local.set({ textMode: 'sanitized' });
    } else {
      capturedTextElement.classList.remove('sanitized-mode');
      capturedTextElement.classList.add('raw-mode');
      displayRawText();
      chrome.storage.local.set({ textMode: 'raw' });
    }
  });

  // Core Functions
  function toggleSplitView() {
    if (contentArea.classList.contains('split-view')) {
      contentArea.classList.remove('split-view');
      contentArea.classList.add('standard-view');
      chrome.storage.local.set({viewMode: 'standard'});
    } else {
      contentArea.classList.remove('standard-view');
      contentArea.classList.add('split-view');
      chrome.storage.local.set({viewMode: 'split'});
    }
  }

  function copyToClipboard(element) {
    if (element.querySelector('.placeholder')) return;
    const text = element.innerText;
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Could not copy text: ', err);
      showHapticFeedback('error');
    });
  }

  function showCopyFeedback(buttonElement) {
    buttonElement.classList.add('copy-success');
    setTimeout(() => buttonElement.classList.remove('copy-success'), 1500);
  }

  function showHapticFeedback(type) {
    let hapticElement = document.querySelector('.haptic-feedback');
    if (!hapticElement) {
      hapticElement = document.createElement('div');
      hapticElement.className = 'haptic-feedback';
      document.body.appendChild(hapticElement);
    }
    
    hapticElement.classList.add(`haptic-${type}`);
    
    if (navigator.vibrate) {
      navigator.vibrate(type === 'success' ? [50] : [30, 20, 60]);
    }
    
    setTimeout(() => hapticElement.classList.remove(`haptic-${type}`), 500);
  }
  
  function showView(viewToShow) {
    mainView.style.display = 'none';
    settingsView.style.display = 'none';
    historyView.style.display = 'none';
    
    viewToShow.style.display = 'block';
    viewToShow.classList.add('spring-in');
    
    setTimeout(() => viewToShow.classList.remove('spring-in'), 500);
  }
  
  function initializeExtension() {
    loadSettings();
    loadStoredContent();
    loadHistory();
    loadThemePreference();
    
    chrome.storage.local.get(['viewMode'], (result) => {
      if (result.viewMode === 'split') {
        contentArea.classList.remove('standard-view');
        contentArea.classList.add('split-view');
      } else {
        contentArea.classList.remove('split-view');
        contentArea.classList.add('standard-view');
      }
    });
  }
  
  function loadStoredContent() {
    chrome.storage.local.get(['capturedText', 'aiResponse', 'selectedModel', 'textMode'], (result) => {
      if (result.capturedText) {
        currentText = result.capturedText;
        
        const sanitized = sanitizeQuestionText(currentText);
        if (sanitized) {
          sanitizedText = formatSanitizedText(sanitized.question, sanitized.options.split('\n'));
        }
        
        const useRawMode = result.textMode === 'raw' || !sanitizedText;
        textModeToggle.checked = !useRawMode && sanitizedText !== null;
        
        if (useRawMode || !sanitizedText) {
          capturedTextElement.classList.add('raw-mode');
          capturedTextElement.classList.remove('sanitized-mode');
          capturedTextElement.textContent = currentText;
        } else {
          capturedTextElement.classList.remove('raw-mode');
          capturedTextElement.classList.add('sanitized-mode');
          capturedTextElement.innerHTML = sanitizedText;
        }
        
        updateStepStatus(stepOCR, 'completed', 'Completed');
      }
      
      if (result.aiResponse) {
        aiResponseElement.innerHTML = displayFormattedResponse(result.aiResponse);
        updateStepStatus(stepAI, 'completed', 'Completed');
      }
      
      if (result.selectedModel) {
        aiModelSelect.value = result.selectedModel;
      }
    });
  }
  
  function loadSettings() {
    chrome.storage.local.get(['chatgptApiKey', 'geminiApiKey', 'doNotStoreKeys'], (result) => {
      if (result.chatgptApiKey) {
        sessionKeys.chatgptApiKey = result.chatgptApiKey;
        chatgptApiKeyInput.value = result.chatgptApiKey;
      }
      
      if (result.geminiApiKey) {
        sessionKeys.geminiApiKey = result.geminiApiKey;
        geminiApiKeyInput.value = result.geminiApiKey;
      }
      
      if (result.doNotStoreKeys) {
        doNotStoreKeysCheckbox.checked = result.doNotStoreKeys;
      }
    });
  }
  
  function saveSettings() {
    sessionKeys.chatgptApiKey = chatgptApiKeyInput.value;
    sessionKeys.geminiApiKey = geminiApiKeyInput.value;
    
    if (!doNotStoreKeysCheckbox.checked) {
      chrome.storage.local.set({
        chatgptApiKey: sessionKeys.chatgptApiKey,
        geminiApiKey: sessionKeys.geminiApiKey,
        doNotStoreKeys: false
      });
      showHapticFeedback('success');
    } else {
      chrome.storage.local.set({
        chatgptApiKey: '',
        geminiApiKey: '',
        doNotStoreKeys: true
      });
      showHapticFeedback('success');
    }
    
    showView(mainView);
  }
  
  function processWithAI(text, model, apiKey, callback) {
    chrome.runtime.sendMessage({
      action: 'processText',
      text: text,
      model: model,
      apiKey: apiKey
    }, function(response) {
      if (response.error) {
        callback(null, response.error);
      } else {
        callback(response.text);
      }
    });
  }
  
  function displayFormattedResponse(responseText) {
    if (!responseText) return '';
    
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
  }
  
  async function extractTextFromImage(imageUrl, apiKey, callback) {
    const model = aiModelSelect.value;
    
    chrome.runtime.sendMessage({
      action: 'callGeminiWithImage',
      imageBase64: imageUrl,
      apiKey: apiKey,
      modelType: model
    }, (response) => {
      if (response.error) {
        callback(null, response.error);
      } else {
        currentText = response.text;
        lastProcessedText = response.text;
        
        const sanitized = sanitizeQuestionText(currentText);
        if (sanitized) {
          sanitizedText = formatSanitizedText(sanitized.question, sanitized.options.split('\n'));
        } else {
          sanitizedText = null;
        }
        
        if (textModeToggle.checked && sanitizedText) {
          capturedTextElement.classList.add('sanitized-mode');
          capturedTextElement.classList.remove('raw-mode');
          capturedTextElement.innerHTML = sanitizedText;
        } else {
          capturedTextElement.classList.add('raw-mode');
          capturedTextElement.classList.remove('sanitized-mode');
          capturedTextElement.textContent = currentText;
          textModeToggle.checked = false;
        }
        
        callback(response.text, null);
      }
    });
  }
  
  function sanitizeQuestionText(text) {
    const questionMatch = text.match(/QUESTION:\n([\s\S]*?)\n\nOPTIONS:/);
    const optionsMatch = text.match(/OPTIONS:\n([\s\S]*?)$/);
    
    if (questionMatch && optionsMatch) {
      const question = questionMatch[1].trim();
      const options = optionsMatch[1].trim();
      return { question, options };
    }
    return null;
  }

  function formatHistoryEntry(question, options, aiResponse) {
    return {
      timestamp: new Date().toISOString(),
      question,
      options,
      aiResponse,
      sanitized: true
    };
  }

  function captureAndProcess() {
    try {
      chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 100 }, function(imageUrl) {
        capturedTextElement.classList.add('loading-shimmer');
        setStatus('Extracting text...');
        updateStepStatus(stepOCR, 'in-progress', 'In Progress');
        
        const apiKey = sessionKeys.geminiApiKey;
        
        if (!apiKey) {
          handleError('API Key Required', 'Please set your Gemini API key in the settings.');
          capturedTextElement.classList.remove('loading-shimmer');
          showHapticFeedback('error');
          return;
        }
        
        chrome.runtime.sendMessage({
          action: 'callGeminiWithImage',
          imageBase64: imageUrl,
          apiKey: apiKey,
          modelType: aiModelSelect.value
        }, function(response) {
          if (response.error) {
            capturedTextElement.classList.remove('loading-shimmer');
            handleError('Text Extraction Error', response.error);
            showHapticFeedback('error');
            return;
          }
          
          currentText = response.text;
          chrome.storage.local.set({ capturedText: currentText });
          
          const sanitized = sanitizeQuestionText(currentText);
          if (sanitized) {
            sanitizedText = formatSanitizedText(sanitized.question, sanitized.options.split('\n'));
          } else {
            sanitizedText = null;
          }
          
          capturedTextElement.classList.remove('loading-shimmer');
          
          if (textModeToggle.checked && sanitizedText) {
            capturedTextElement.classList.remove('raw-mode');
            capturedTextElement.classList.add('sanitized-mode');
            capturedTextElement.innerHTML = sanitizedText;
            chrome.storage.local.set({ textMode: 'sanitized' });
          } else {
            capturedTextElement.classList.remove('sanitized-mode');
            capturedTextElement.classList.add('raw-mode');
            capturedTextElement.textContent = currentText;
            textModeToggle.checked = false;
            chrome.storage.local.set({ textMode: 'raw' });
          }
          
          setStatus('Text extracted successfully');
          updateStepStatus(stepOCR, 'completed', 'Completed');
          showHapticFeedback('success');
          
          processExtractedText(currentText);
        });
      });
    } catch (error) {
      handleError('Capture Error', error.message);
      showHapticFeedback('error');
    }
  }
  
  function processExtractedText(text) {
    setStatus('Processing with AI...');
    updateStepStatus(stepAI, 'in-progress', 'In Progress');
    aiResponseElement.innerHTML = '<p>Analyzing text with AI...</p>';
    aiResponseElement.classList.add('loading-shimmer');
    
    const model = aiModelSelect.value;
    let aiApiKey = model === 'chatgpt' ? sessionKeys.chatgptApiKey : sessionKeys.geminiApiKey;
    
    if (!aiApiKey) {
      const provider = model === 'chatgpt' ? 'OpenAI' : 'Gemini';
      handleError('API Key Required', `Please set your ${provider} API key in the settings.`);
      aiResponseElement.classList.remove('loading-shimmer');
      showHapticFeedback('error');
      return;
    }
    
    processWithAI(text, model, aiApiKey, function(response, error) {
      if (error) {
        aiResponseElement.classList.remove('loading-shimmer');
        handleError('AI Processing Error', error);
        showHapticFeedback('error');
        return;
      }
      
      aiResponseElement.classList.remove('loading-shimmer');
      aiResponseElement.innerHTML = displayFormattedResponse(response);
      chrome.storage.local.set({ aiResponse: response });
      
      if (sanitizedText && sanitizeQuestionText(currentText)) {
        const { question, options } = sanitizeQuestionText(currentText);
        const historyEntry = {
          timestamp: new Date().toISOString(),
          question: question,
          options: options,
          aiResponse: response,
          model: model
        };
        
        historyEntries.unshift(historyEntry);
        chrome.storage.local.set({ historyEntries });
      } else {
        // Fallback for raw text
        const historyEntry = {
          timestamp: new Date().toISOString(),
          question: "Raw Text (Not Sanitized)",
          options: currentText,
          aiResponse: response,
          model: model
        };
        
        historyEntries.unshift(historyEntry);
        chrome.storage.local.set({ historyEntries });
      }
      
      setStatus('Analysis completed');
      updateStepStatus(stepAI, 'completed', 'Completed');
      showHapticFeedback('success');
    });
  }
  
  function loadThemePreference() {
    chrome.storage.local.get(['theme'], function(data) {
      if (data.theme) {
        document.documentElement.setAttribute('data-theme', data.theme);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        chrome.storage.local.set({theme: 'dark'});
      }
    });
  }
  
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    chrome.storage.local.set({theme: newTheme});
    
    document.body.style.opacity = '0.98';
    setTimeout(() => document.body.style.opacity = '1', 150);
  }
  
  function loadHistory() {
    chrome.storage.local.get(['historyEntries', 'history'], function(data) {
      if (data.historyEntries && Array.isArray(data.historyEntries)) {
        historyEntries = data.historyEntries;
      } else if (data.history && Array.isArray(data.history)) {
        historyEntries = data.history;
        chrome.storage.local.set({ historyEntries: historyEntries });
      }
    });
  }
  
  function renderHistoryEntries() {
    historyEntriesContainer.innerHTML = '';
    
    const totalPages = Math.max(1, Math.ceil(historyEntries.length / entriesPerPage));
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = Math.min(startIndex + entriesPerPage, historyEntries.length);
    
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    if (historyEntries.length === 0) {
      historyEntriesContainer.innerHTML = `
        <div class="empty-history-message">
          <span class="fa-icon fa-icon-history empty-icon" style="width: 48px; height: 48px;"></span>
          <p>No history entries yet. Capture some text to get started!</p>
        </div>
      `;
      return;
    }
    
    for (let i = startIndex; i < endIndex; i++) {
      const entry = historyEntries[i];
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      const entryElement = document.createElement('div');
      entryElement.className = 'history-entry';
      entryElement.dataset.id = i.toString();
      
      const capturedText = entry.capturedText || entry.options || entry.question || 'No text available';
      const aiResponse = entry.aiResponse || 'No response available';
      
      const truncatedCapturedText = truncateText(capturedText, 300);
      const truncatedAiResponse = truncateText(aiResponse, 300);
      
      entryElement.innerHTML = `
        <div class="entry-header">
          <div class="entry-timestamp">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>
            ${formattedDate}
          </div>
          <div class="header-right">
            <span class="entry-model ${entry.model || 'gemini'}">${entry.model === 'chatgpt' ? 'ChatGPT' : 'Gemini'}</span>
            <svg class="toggle-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
            </svg>
          </div>
        </div>
        <div class="entry-content">
          <div class="entry-section">
            <div class="entry-label">Captured Text:</div>
            <div class="entry-text">${escapeHTML(truncatedCapturedText)}</div>
          </div>
          <div class="entry-section">
            <div class="entry-label">AI Response:</div>
            <div class="entry-text ai-response">${escapeHTML(truncatedAiResponse)}</div>
          </div>
          <div class="entry-actions">
            <button class="action-button copy-entry" title="Copy to clipboard">
              <span class="fa-icon fa-icon-copy" style="margin-right: 6px;"></span> Copy
            </button>
            <button class="action-button danger-button delete-entry" title="Delete entry">
              <span class="fa-icon fa-icon-trash" style="margin-right: 6px;"></span> Delete
            </button>
          </div>
        </div>
      `;
      
      const headerEl = entryElement.querySelector('.entry-header');
      
      const toggleExpand = () => {
        entryElement.classList.toggle('expanded');
      };
      
      headerEl.addEventListener('click', toggleExpand);
      
      const copyBtn = entryElement.querySelector('.copy-entry');
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const textToCopy = `Captured Text:\n${capturedText || ''}\n\nAI Response:\n${aiResponse || ''}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
          showCopyFeedback(copyBtn);
          showHapticFeedback('success');
        });
      });
      
      const deleteBtn = entryElement.querySelector('.delete-entry');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this entry?')) {
          const entryIndex = historyEntries.indexOf(entry);
          if (entryIndex !== -1) {
            historyEntries.splice(entryIndex, 1);
            chrome.storage.local.set({ historyEntries }, () => {
              renderHistoryEntries();
              showHapticFeedback('success');
            });
          }
        }
      });
      
      historyEntriesContainer.appendChild(entryElement);
    }
  }
  
  function exportHistory() {
    if (historyEntries.length === 0) {
      setStatus('No history entries to export');
      return;
    }
    
    let exportText = "# Text Analyzer History Export\n\n";
    
    historyEntries.forEach((entry, index) => {
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      const capturedText = entry.capturedText || entry.options || entry.question || 'No text available';
      const aiResponse = entry.aiResponse || 'No response available';
      
      exportText += `## Entry ${index + 1} - ${formattedDate} (${entry.model === 'chatgpt' ? 'ChatGPT' : 'Gemini'})\n\n`;
      exportText += `### Captured Text:\n${capturedText}\n\n`;
      exportText += `### AI Response:\n${aiResponse}\n\n`;
      exportText += "---\n\n";
    });
    
    const blob = new Blob([exportText], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-analyzer-history-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    setStatus('History exported successfully');
  }
  
  function clearAllHistory() {
    historyEntries = [];
    chrome.storage.local.set({historyEntries: [], history: []});
    renderHistoryEntries();
    setStatus('History cleared');
  }
  
  function setStatus(message) {
    if (statusMessage) {
      statusMessage.textContent = message;
    }
  }

  function updateStepStatus(stepElement, statusClass, text) {
    if (stepElement) {
      const statusEl = stepElement.querySelector('.step-status');
      if (statusEl) {
        statusEl.className = `step-status ${statusClass}`;
        statusEl.textContent = text;
      }
    }
  }

  function handleError(message, details) {
    console.error(message, details);
    setStatus(`Error: ${message}`);
    if (loader) {
      loader.classList.remove('active');
    }
    updateStepStatus(stepOCR, 'error', 'Error');
    updateStepStatus(stepAI, 'error', 'Error');
    showHapticFeedback('error');
  }

  function displayRawText() {
    if (currentText) {
      capturedTextElement.textContent = currentText;
    } else {
      capturedTextElement.innerHTML = '<p class="placeholder">Captured text will appear here</p>';
    }
  }

  function displaySanitizedText() {
    if (sanitizedText) {
      capturedTextElement.innerHTML = sanitizedText;
    } else if (currentText) {
      const sanitized = sanitizeQuestionText(currentText);
      if (sanitized) {
        sanitizedText = formatSanitizedText(sanitized.question, sanitized.options.split('\n'));
        capturedTextElement.innerHTML = sanitizedText;
      } else {
        capturedTextElement.textContent = currentText;
      }
    } else {
      capturedTextElement.innerHTML = '<p class="placeholder">Captured text will appear here</p>';
    }
  }

  function formatSanitizedText(question, options) {
    return `
      <div class="question-text">${question}</div>
      <div class="options-text">
        ${options.map((option, index) => 
          `<p data-option="${String.fromCharCode(65 + index)}. ">${option.trim()}</p>`
        ).join('')}
      </div>
    `;
  }

  function clearText() {
    currentText = '';
    sanitizedText = null;
    lastProcessedText = '';
    capturedTextElement.innerHTML = '<p class="placeholder">Captured text will appear here</p>';
    capturedTextElement.classList.remove('loading-shimmer');
    updateStepStatus(stepOCR, 'waiting', 'Waiting');
    chrome.storage.local.remove('capturedText', function() {
      setStatus('Text cleared');
    });
  }

  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
}); 