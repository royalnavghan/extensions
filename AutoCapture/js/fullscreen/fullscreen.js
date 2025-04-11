/**
 * Text Analyzer Extension Fullscreen Script
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
  const clearTextBtn = document.getElementById('clearText');
  const clearResponseBtn = document.getElementById('clearResponse');
  const splitViewToggleBtn = document.getElementById('splitViewToggle');
  const contentArea = document.getElementById('contentArea');
  const copyTextBtn = document.getElementById('copyText');
  const copyResponseBtn = document.getElementById('copyResponse');
  const stepOCR = document.getElementById('stepOCR');
  const stepAI = document.getElementById('stepAI');
  const minimizeToSidePanelBtn = document.getElementById('minimizeToSidePanel');
  
  const tabButtons = document.querySelectorAll('.nav-tab');
  const contentViews = document.querySelectorAll('.content-view');
  const contentViewMap = {
    'mainContent': document.getElementById('mainContent'),
    'autoCaptureContent': document.getElementById('autoCaptureContent'),
    'historyContent': document.getElementById('historyContent'),
    'settingsView': document.getElementById('settingsView')
  };
  
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
  const exportHistoryBtn = document.getElementById('exportHistory');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageIndicator = document.getElementById('pageIndicator');
  const historyFilterButtons = document.querySelectorAll('.btn-filter');
  
  const autoCaptureToggle = document.getElementById('autoCaptureToggle');
  const autoCaptureStatus = document.getElementById('autoCaptureStatus');
  const captureTabSelect = document.getElementById('captureTabSelect');
  const captureInterval = document.getElementById('captureInterval');
  const autoCaptureModel = document.getElementById('autoCaptureModel');
  const sendToTelegram = document.getElementById('sendToTelegram');
  const telegramNotConfigured = document.getElementById('telegramNotConfigured');
  const startAutoCaptureBtn = document.getElementById('startAutoCapture');
  const stopAutoCaptureBtn = document.getElementById('stopAutoCapture');
  const captureLiveStatus = document.getElementById('captureLiveStatus');
  const captureTabInfo = document.getElementById('captureTabInfo');
  const nextCaptureTime = document.getElementById('nextCaptureTime');
  const totalCaptures = document.getElementById('totalCaptures');
  const telegramStatus = document.getElementById('telegramStatus');
  const captureLogEntries = document.getElementById('captureLogEntries');
  
  let sessionKeys = {
    chatgptApiKey: '',
    geminiApiKey: '',
    telegramBotToken: '',
    telegramChatId: ''
  };
  
  let historyEntries = [];
  let currentPage = 1;
  const entriesPerPage = 12;
  let activeHistoryFilter = 'all';
  
  const textModeToggle = document.getElementById('textModeToggle');
  let currentText = '';
  let sanitizedText = null;
  let lastProcessedText = '';
  
  let autoCaptureActive = false;
  let captureTimerId = null;
  let captureCount = 0;
  let selectedTabId = null;
  let selectedTabTitle = '';
  let nextCaptureTimeoutId = null;
  let autoCaptureSettings = {
    intervalSeconds: 30,
    model: 'chatgpt',
    sendToTelegram: false
  };
  
  initializeExtension();
  
  captureTextBtn.addEventListener('click', captureAndProcess);
  aiModelSelect.addEventListener('change', () => chrome.storage.local.set({selectedModel: aiModelSelect.value}));
  themeToggleBtn.addEventListener('click', toggleTheme);
  settingsBtn.addEventListener('click', () => showContentView('settingsView'));
  clearTextBtn.addEventListener('click', clearText);
  clearResponseBtn.addEventListener('click', clearResponse);
  splitViewToggleBtn.addEventListener('click', toggleSplitView);
  copyTextBtn.addEventListener('click', () => copyToClipboard(capturedTextElement));
  copyResponseBtn.addEventListener('click', () => copyToClipboard(aiResponseElement));
  textModeToggle.addEventListener('change', toggleTextMode);
  minimizeToSidePanelBtn.addEventListener('click', minimizeToSidePanel);
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetView = this.getAttribute('data-target');
      showContentView(targetView);
    });
  });
  
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
      this.querySelector('.eye-icon').classList.toggle('eye-icon-hidden');
    });
  });
  
  settingsTabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      settingsTabBtns.forEach(tab => tab.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      const targetTab = this.getAttribute('data-target');
      document.getElementById(targetTab).classList.add('active');
    });
  });
  
  sidePanelModeRadio.addEventListener('change', updateDisplayMode);
  fullScreenModeRadio.addEventListener('change', updateDisplayMode);
  
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
    const totalPages = Math.ceil(getFilteredHistory().length / entriesPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderHistoryEntries();
    }
  });
  
  historyFilterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      historyFilterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeHistoryFilter = this.id.replace('filter', '').toLowerCase();
      currentPage = 1;
      renderHistoryEntries();
    });
  });
  
  autoCaptureToggle.addEventListener('change', function() {
    updateAutoCaptureUI(this.checked);
  });
  
  captureTabSelect.addEventListener('change', function() {
    selectedTabId = parseInt(this.value);
    if (selectedTabId) {
      chrome.tabs.get(selectedTabId, function(tab) {
        if (chrome.runtime.lastError) {
          console.error('Error getting tab:', chrome.runtime.lastError);
          selectedTabTitle = 'Unknown Tab';
        } else {
          selectedTabTitle = tab.title;
        }
        
        captureTabInfo.textContent = selectedTabTitle;
        
        chrome.runtime.sendMessage({
          action: 'injectContentScript',
          tabId: selectedTabId
        }, function(response) {
          if (chrome.runtime.lastError || !response || !response.success) {
            const errorMsg = chrome.runtime.lastError ? 
              chrome.runtime.lastError.message : 
              (response && response.error ? response.error : 'Unknown error');
            addCaptureLogEntry(`Failed to inject content script: ${errorMsg}`, 'warning');
            console.warn('Content script injection failed:', errorMsg);
          } else {
            addCaptureLogEntry('Tab selected and content script ready', 'info');
          }
        });
      });
    } else {
      selectedTabTitle = '';
      captureTabInfo.textContent = 'No tab selected';
    }
    validateAutoCaptureForm();
  });
  
  captureInterval.addEventListener('input', function() {
    const value = parseInt(this.value);
    if (value < 5) {
      this.value = 5;
    }
    validateAutoCaptureForm();
    autoCaptureSettings.intervalSeconds = parseInt(this.value);
  });
  
  autoCaptureModel.addEventListener('change', function() {
    autoCaptureSettings.model = this.value;
  });
  
  sendToTelegram.addEventListener('change', function() {
    autoCaptureSettings.sendToTelegram = this.checked;
    
    if (this.checked) {
      const hasTelegramConfig = sessionKeys.telegramBotToken && sessionKeys.telegramChatId;
      
      if (!hasTelegramConfig) {
        telegramNotConfigured.classList.remove('hidden');
      } else {
        telegramNotConfigured.classList.add('hidden');
      }
    } else {
      telegramNotConfigured.classList.add('hidden');
    }
    
    validateAutoCaptureForm();
  });
  
  startAutoCaptureBtn.addEventListener('click', startAutoCapture);
  stopAutoCaptureBtn.addEventListener('click', stopAutoCapture);
  
  testTelegramConnectionBtn.addEventListener('click', testTelegramConnection);
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', () => showContentView('mainContent'));
  
  function initializeExtension() {
    loadThemePreference();
    loadStoredContent();
    loadSettings();
    loadHistory();
    populateTabList();
    loadAutoCaptureSettings();
    
    chrome.storage.local.get(['splitView'], function(result) {
      if (result.splitView) {
        contentArea.classList.add('split-view');
        contentArea.classList.remove('standard-view');
      }
    });
  }
  
  function loadStoredContent() {
    chrome.storage.local.get(['capturedText', 'aiResponse', 'selectedModel', 'sanitizedText'], function(result) {
      if (result.capturedText) {
        currentText = result.capturedText;
        displayRawText();
      }
      
      if (result.sanitizedText) {
        sanitizedText = result.sanitizedText;
        if (textModeToggle.checked) {
          displaySanitizedText();
        }
      }
      
      if (result.aiResponse) {
        displayFormattedResponse(result.aiResponse);
      }
      
      if (result.selectedModel) {
        aiModelSelect.value = result.selectedModel;
        autoCaptureModel.value = result.selectedModel;
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
        if (result.chatgptApiKey) {
          chatgptApiKeyInput.value = result.chatgptApiKey;
          sessionKeys.chatgptApiKey = result.chatgptApiKey;
        }
        
        if (result.geminiApiKey) {
          geminiApiKeyInput.value = result.geminiApiKey;
          sessionKeys.geminiApiKey = result.geminiApiKey;
        }
        
        if (result.telegramBotToken) {
          telegramBotTokenInput.value = result.telegramBotToken;
          sessionKeys.telegramBotToken = result.telegramBotToken;
        }
        
        if (result.telegramChatId) {
          telegramChatIdInput.value = result.telegramChatId;
          sessionKeys.telegramChatId = result.telegramChatId;
        }
      }
      
      doNotStoreKeysCheckbox.checked = result.doNotStoreKeys || false;
      
      if (result.displayMode) {
        if (result.displayMode === 'fullScreen') {
          fullScreenModeRadio.checked = true;
          sidePanelModeRadio.checked = false;
        } else {
          sidePanelModeRadio.checked = true;
          fullScreenModeRadio.checked = false;
        }
      }
      
      rememberLastModeCheckbox.checked = result.rememberLastMode || false;
      
      const hasTelegramConfig = sessionKeys.telegramBotToken && sessionKeys.telegramChatId;
      if (!hasTelegramConfig && sendToTelegram.checked) {
        telegramNotConfigured.classList.remove('hidden');
      } else {
        telegramNotConfigured.classList.add('hidden');
      }
    });
  }
  
  function populateTabList() {
    chrome.tabs.query({}, function(tabs) {
      captureTabSelect.innerHTML = '';
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select a tab --';
      captureTabSelect.appendChild(defaultOption);
      
      tabs.forEach(function(tab) {
        const option = document.createElement('option');
        option.value = tab.id;
        option.textContent = tab.title;
        captureTabSelect.appendChild(option);
        
        if (selectedTabId && tab.id === selectedTabId) {
          option.selected = true;
          selectedTabTitle = tab.title;
          captureTabInfo.textContent = selectedTabTitle;
        }
      });
      
      validateAutoCaptureForm();
    });
  }
  
  function loadAutoCaptureSettings() {
    chrome.storage.local.get(['autoCaptureSettings'], function(result) {
      if (result.autoCaptureSettings) {
        autoCaptureSettings = result.autoCaptureSettings;
        
        captureInterval.value = autoCaptureSettings.intervalSeconds;
        autoCaptureModel.value = autoCaptureSettings.model;
        sendToTelegram.checked = autoCaptureSettings.sendToTelegram;
        
        if (sendToTelegram.checked) {
          const hasTelegramConfig = sessionKeys.telegramBotToken && sessionKeys.telegramChatId;
          if (!hasTelegramConfig) {
            telegramNotConfigured.classList.remove('hidden');
          }
        }
      }
    });
  }
  
  function validateAutoCaptureForm() {
    const isValid = 
      captureTabSelect.value && 
      captureInterval.value >= 5 && 
      (!sendToTelegram.checked || (sessionKeys.telegramBotToken && sessionKeys.telegramChatId));
    
    startAutoCaptureBtn.disabled = !isValid;
  }
  
  function updateAutoCaptureUI(isEnabled) {
    autoCaptureStatus.textContent = isEnabled ? 'Enabled' : 'Disabled';
    
    if (isEnabled) {
      autoCaptureToggle.checked = true;
      captureTabSelect.disabled = false;
      captureInterval.disabled = false;
      autoCaptureModel.disabled = false;
      sendToTelegram.disabled = false;
      validateAutoCaptureForm();
    } else {
      autoCaptureToggle.checked = false;
      captureTabSelect.disabled = true;
      captureInterval.disabled = true;
      autoCaptureModel.disabled = true;
      sendToTelegram.disabled = true;
      startAutoCaptureBtn.disabled = true;
      
      if (autoCaptureActive) {
        stopAutoCapture();
      }
    }
  }
  
  function showContentView(viewId) {
    contentViews.forEach(view => view.classList.remove('active'));
    tabButtons.forEach(tab => tab.classList.remove('active'));
    
    const targetView = contentViewMap[viewId];
    if (targetView) {
      targetView.classList.add('active');
      
      const tabButton = document.querySelector(`.nav-tab[data-target="${viewId}"]`);
      if (tabButton) {
        tabButton.classList.add('active');
      }
      
      if (viewId === 'historyContent') {
        renderHistoryEntries();
      } else if (viewId === 'autoCaptureContent') {
        populateTabList();
      }
    }
  }
  
  function minimizeToSidePanel() {
    if (chrome.sidePanel) {
      chrome.windows.getCurrent(function(window) {
        chrome.sidePanel.open({
          windowId: window.id
        }).then(() => {
          chrome.storage.local.set({displayMode: 'sidePanel'}, () => {
            chrome.tabs.getCurrent(function(tab) {
              if (tab) {
                chrome.tabs.remove(tab.id);
              } else {
                console.error('Could not get current tab ID');
                showStatusMessage('Failed to close this tab. Please close it manually.', 'warning');
              }
            });
          });
        }).catch(error => {
          console.error('Error opening side panel:', error);
          showStatusMessage('Failed to open side panel: ' + error.message, 'error');
        });
      });
    } else {
      chrome.storage.local.set({displayMode: 'sidePanel'}, () => {
        showStatusMessage('Side panel feature is not available in this browser version', 'warning');
      });
    }
  }
  
  function updateDisplayMode() {
    const mode = document.querySelector('input[name="displayMode"]:checked').value;
    chrome.storage.local.set({
      displayMode: mode,
      rememberLastMode: rememberLastModeCheckbox.checked
    });
    
    if (mode === 'sidePanel') {
      minimizeToSidePanel();
    }
  }
  
  function startAutoCapture() {
    if (autoCaptureActive) return;
    
    saveAutoCaptureSettings();
    
    autoCaptureActive = true;
    captureCount = 0;
    
    startAutoCaptureBtn.classList.add('hidden');
    stopAutoCaptureBtn.classList.remove('hidden');
    
    captureTabSelect.disabled = true;
    captureInterval.disabled = true;
    autoCaptureModel.disabled = true;
    sendToTelegram.disabled = true;
    
    captureLiveStatus.textContent = 'Active';
    captureLiveStatus.classList.add('status-active');
    totalCaptures.textContent = '0';
    
    if (sendToTelegram.checked) {
      telegramStatus.textContent = 'Enabled';
    } else {
      telegramStatus.textContent = 'Disabled';
    }
    
    addCaptureLogEntry('Auto capture started', 'success');
    
    scheduleNextCapture(1);
  }
  
  function scheduleNextCapture(delaySeconds) {
    const intervalMs = delaySeconds * 1000;
    
    if (nextCaptureTimeoutId) {
      clearTimeout(nextCaptureTimeoutId);
    }
    
    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() + delaySeconds);
    
    updateNextCaptureCountdown(endTime);
    
    nextCaptureTimeoutId = setTimeout(() => {
      performAutoCapture();
    }, intervalMs);
  }
  
  function updateNextCaptureCountdown(endTime) {
    updateTimeDisplay();
    
    const countdownInterval = setInterval(updateTimeDisplay, 1000);
    
    function updateTimeDisplay() {
      if (!autoCaptureActive) {
        clearInterval(countdownInterval);
        nextCaptureTime.textContent = '--:--';
        return;
      }
      
      const now = new Date();
      const diffMs = endTime - now;
      
      if (diffMs <= 0) {
        clearInterval(countdownInterval);
        nextCaptureTime.textContent = 'In progress...';
        return;
      }
      
      const diffSecs = Math.ceil(diffMs / 1000);
      const minutes = Math.floor(diffSecs / 60);
      const seconds = diffSecs % 60;
      
      nextCaptureTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  function performAutoCapture() {
    if (!autoCaptureActive || !selectedTabId) {
      return;
    }
    
    chrome.tabs.sendMessage(selectedTabId, { action: 'extractText' }, function(response) {
      if (chrome.runtime.lastError) {
        addCaptureLogEntry(`Content script error: ${chrome.runtime.lastError.message}`, 'error');
        captureTabScreenshot();
        return;
      }
      
      if (response && response.success) {
        const extractedText = response.selectedText || response.visibleText || response.bodyText;
        if (extractedText && extractedText.trim().length > 0) {
          processAutoCapturedText(extractedText);
        } else {
          addCaptureLogEntry('No text found on page, falling back to screenshot', 'info');
          captureTabScreenshot();
        }
      } else {
        addCaptureLogEntry('Content script failed, falling back to screenshot', 'error');
        captureTabScreenshot();
      }
    });
  }
  
  function captureTabScreenshot() {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(screenshotUrl) {
      if (chrome.runtime.lastError) {
        addCaptureLogEntry(`Capture failed: ${chrome.runtime.lastError.message}`, 'error');
        scheduleNextCapture(autoCaptureSettings.intervalSeconds);
        return;
      }
      
      extractTextFromImage(screenshotUrl, function(extractedText) {
        if (extractedText) {
          processAutoCapturedText(extractedText);
        } else {
          addCaptureLogEntry('Text extraction failed', 'error');
          scheduleNextCapture(autoCaptureSettings.intervalSeconds);
        }
      });
    });
  }
  
  function processAutoCapturedText(text) {
    if (!text) {
      addCaptureLogEntry('No text extracted from screenshot', 'error');
      scheduleNextCapture(autoCaptureSettings.intervalSeconds);
      return;
    }
    
    const sanitizedText = sanitizeQuestionText(text);
    
    const model = autoCaptureSettings.model;
    let apiKey = '';
    
    if (model === 'chatgpt') {
      apiKey = sessionKeys.chatgptApiKey;
    } else if (model.startsWith('gemini')) {
      apiKey = sessionKeys.geminiApiKey;
    }
    
    if (!apiKey) {
      const provider = model === 'chatgpt' ? 'OpenAI' : 'Gemini';
      addCaptureLogEntry(`${provider} API key not configured`, 'error');
      scheduleNextCapture(autoCaptureSettings.intervalSeconds);
      return;
    }
    
    addCaptureLogEntry('Processing with AI...', 'info');
    
    chrome.runtime.sendMessage({
      action: 'processText',
      text: sanitizedText,
      model: model,
      apiKey: apiKey
    }, function(response) {
      if (response.error) {
        addCaptureLogEntry(`AI processing failed: ${response.error}`, 'error');
        scheduleNextCapture(autoCaptureSettings.intervalSeconds);
        return;
      }
      
      captureCount++;
      totalCaptures.textContent = captureCount.toString();
      
      const entry = {
        timestamp: new Date().toISOString(),
        model: model,
        rawText: text,
        sanitizedText: sanitizedText,
        aiResponse: response.text,
        type: 'auto',
        sentToTelegram: false
      };
      
      if (autoCaptureSettings.sendToTelegram) {
        sendToTelegramAPI(entry).then(success => {
          entry.sentToTelegram = success;
          addHistoryEntry(entry);
          scheduleNextCapture(autoCaptureSettings.intervalSeconds);
        });
      } else {
        addHistoryEntry(entry);
        scheduleNextCapture(autoCaptureSettings.intervalSeconds);
      }
    });
  }
  
  function stopAutoCapture() {
    if (!autoCaptureActive) return;
    
    autoCaptureActive = false;
    
    if (nextCaptureTimeoutId) {
      clearTimeout(nextCaptureTimeoutId);
      nextCaptureTimeoutId = null;
    }
    
    startAutoCaptureBtn.classList.remove('hidden');
    stopAutoCaptureBtn.classList.add('hidden');
    
    if (autoCaptureToggle.checked) {
      captureTabSelect.disabled = false;
      captureInterval.disabled = false;
      autoCaptureModel.disabled = false;
      sendToTelegram.disabled = false;
    }
    
    captureLiveStatus.textContent = 'Inactive';
    captureLiveStatus.classList.remove('status-active');
    nextCaptureTime.textContent = '--:--';
    
    addCaptureLogEntry('Auto capture stopped', 'info');
  }
  
  function saveAutoCaptureSettings() {
    autoCaptureSettings = {
      intervalSeconds: parseInt(captureInterval.value),
      model: autoCaptureModel.value,
      sendToTelegram: sendToTelegram.checked
    };
    
    chrome.storage.local.set({ autoCaptureSettings });
  }
  
  async function sendToTelegramAPI(entry) {
    if (!sessionKeys.telegramBotToken || !sessionKeys.telegramChatId) {
      addCaptureLogEntry('Telegram not configured', 'error');
      return false;
    }
    
    try {
      const message = formatTelegramMessage(entry);
      
      const response = await fetch(`https://api.telegram.org/bot${sessionKeys.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: sessionKeys.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        addCaptureLogEntry('Sent to Telegram successfully', 'success');
        return true;
      } else {
        addCaptureLogEntry(`Failed to send to Telegram: ${data.description}`, 'error');
        return false;
      }
    } catch (error) {
      addCaptureLogEntry(`Telegram API error: ${error.message}`, 'error');
      return false;
    }
  }
  
  function formatTelegramMessage(entry) {
    const escapeHTML = (text) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };
    
    const escapedTitle = escapeHTML(selectedTabTitle);
    const escapedText = escapeHTML(entry.sanitizedText);
    const escapedResponse = escapeHTML(entry.aiResponse);
    const escapedModel = escapeHTML(entry.model);
    
    const timestamp = new Date(entry.timestamp);
    const formattedTime = timestamp.toLocaleString();
    
    const message = [
      `<b>Auto Capture - ${formattedTime}</b>`,
      '',
      `<b>Source:</b> ${escapedTitle}`,
      `<b>Model:</b> ${escapedModel}`,
      '',
      `<b>Extracted Text:</b>`,
      escapedText.substring(0, 300) + (escapedText.length > 300 ? '...' : ''),
      '',
      `<b>AI Response:</b>`,
      escapedResponse.substring(0, 1000) + (escapedResponse.length > 1000 ? '...' : '')
    ].join('\n');
    
    return message;
  }
  
  function addCaptureLogEntry(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-entry-${type}`;
    
    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    logEntry.innerHTML = `
      <div class="log-entry-time">${timeFormatted}</div>
      <p class="log-entry-message">${message}</p>
    `;
    
    const emptyMessage = captureLogEntries.querySelector('.empty-log-message');
    if (emptyMessage) {
      emptyMessage.remove();
    }
    
    captureLogEntries.insertBefore(logEntry, captureLogEntries.firstChild);
    
    const entries = captureLogEntries.querySelectorAll('.log-entry');
    if (entries.length > 20) {
      entries[entries.length - 1].remove();
    }
  }
  
  function addHistoryEntry(entry) {
    historyEntries.unshift(entry);
    
    chrome.storage.local.set({ history: historyEntries });
    
    if (document.getElementById('historyContent').classList.contains('active')) {
      renderHistoryEntries();
    }
    
    addCaptureLogEntry(`Capture #${captureCount} completed and saved to history`, 'success');
  }
  
  async function captureAndProcess() {
    try {
      showLoader('Capturing text...');
      updateProcessingStep('stepOCR', 'in-progress');
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      const screenshotUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      
      extractTextFromImage(screenshotUrl, function(extractedText) {
        if (!extractedText) {
          hideLoader();
          updateProcessingStep('stepOCR', 'failed');
          showStatusMessage('Failed to extract text from screenshot', 'error');
          return;
        }
        
        currentText = extractedText;
        sanitizedText = sanitizeQuestionText(extractedText);
        displayRawText();
        
        chrome.storage.local.set({
          capturedText: currentText,
          sanitizedText: sanitizedText,
          lastCapture: {
            tabId: activeTab.id,
            tabTitle: activeTab.title,
            timestamp: new Date().toISOString()
          }
        });
        
        updateProcessingStep('stepOCR', 'complete');
        
        processWithAI();
      });
    } catch (error) {
      console.error('Error capturing text:', error);
      hideLoader();
      updateProcessingStep('stepOCR', 'failed');
      showStatusMessage('Error capturing text: ' + error.message, 'error');
    }
  }
  
  function extractTextFromImage(imageUrl, callback) {
    showLoader('Extracting text...');
    
    chrome.runtime.sendMessage({
      action: 'extractText',
      imageUrl: imageUrl
    }, function(response) {
      if (response.error) {
        console.error('OCR Error:', response.error);
        callback(null);
        return;
      }
      
      callback(response.text);
    });
  }
  
  function processWithAI() {
    if (!sanitizedText) {
      showStatusMessage('No text to process', 'error');
      return;
    }
    
    const model = aiModelSelect.value;
    let apiKey = '';
    
    if (model === 'chatgpt') {
      apiKey = sessionKeys.chatgptApiKey;
    } else if (model.startsWith('gemini')) {
      apiKey = sessionKeys.geminiApiKey;
    }
    
    if (!apiKey) {
      hideLoader();
      updateProcessingStep('stepAI', 'failed');
      showStatusMessage('Please set your API key in settings first', 'error');
      return;
    }
    
    if (sanitizedText === lastProcessedText) {
      hideLoader();
      return;
    }
    
    lastProcessedText = sanitizedText;
    showLoader('Analyzing with AI...');
    updateProcessingStep('stepAI', 'in-progress');
    
    chrome.runtime.sendMessage({
      action: 'processText',
      text: sanitizedText,
      model: model,
      apiKey: apiKey
    }, function(response) {
      hideLoader();
      
      if (response.error) {
        console.error('AI Processing Error:', response.error);
        updateProcessingStep('stepAI', 'failed');
        showStatusMessage(`Error: ${response.error}`, 'error');
        return;
      }
      
      updateProcessingStep('stepAI', 'complete');
      displayFormattedResponse(response.text);
      
      chrome.storage.local.set({ aiResponse: response.text });
      
      const historyEntry = {
        timestamp: new Date().toISOString(),
        model: model,
        rawText: currentText,
        sanitizedText: sanitizedText,
        aiResponse: response.text,
        type: 'manual',
        sentToTelegram: false
      };
      
      addHistoryEntry(historyEntry);
    });
  }
  
  function sanitizeQuestionText(text) {
    if (!text) return '';
    
    let sanitized = text.trim();
    
    const lines = sanitized.split('\n');
    const questionLines = [];
    let foundOptions = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;
      
      if (/^[a-dA-D][\.\)]\s/.test(trimmedLine)) {
        foundOptions = true;
        questionLines.push(trimmedLine);
      } else if (!foundOptions) {
        questionLines.push(trimmedLine);
      }
    }
    
    sanitized = questionLines.join('\n');
    
    sanitized = sanitized
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return sanitized;
  }
  
  function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply theme to document
    html.setAttribute('data-theme', newTheme);
    
    // Force style recalculation
    void html.offsetHeight;
    
    // Apply same theme to body element for redundancy
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(newTheme + '-theme');
    
    // Save theme preference
    chrome.storage.local.set({theme: newTheme}, function() {
      console.log('Theme saved:', newTheme);
    });
  }
  
  function loadThemePreference() {
    chrome.storage.local.get(['theme'], function(result) {
      if (result.theme) {
        const theme = result.theme;
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        
        // Apply same theme to body for redundancy
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(theme + '-theme');
        
        console.log('Theme loaded:', theme);
      }
    });
  }
  
  function showLoader(message = 'Loading...') {
    loader.classList.remove('hidden');
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden');
  }
  
  function hideLoader() {
    loader.classList.add('hidden');
    statusMessage.classList.add('hidden');
  }
  
  function showStatusMessage(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    statusMessage.classList.add(type);
    statusMessage.classList.remove('hidden');
    
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  }
  
  function copyToClipboard(element) {
    const text = element.textContent;
    navigator.clipboard.writeText(text)
      .then(() => showStatusMessage('Copied to clipboard!', 'success'))
      .catch(err => showStatusMessage('Failed to copy: ' + err, 'error'));
  }
  
  function clearText() {
    capturedTextElement.textContent = '';
    currentText = '';
    sanitizedText = null;
    chrome.storage.local.remove(['capturedText', 'sanitizedText']);
    updateProcessingStep('stepOCR', 'idle');
  }
  
  function clearResponse() {
    aiResponseElement.textContent = '';
    chrome.storage.local.remove(['aiResponse']);
    updateProcessingStep('stepAI', 'idle');
  }
  
  function toggleSplitView() {
    contentArea.classList.toggle('split-view');
    contentArea.classList.toggle('standard-view');
    
    const isSplitView = contentArea.classList.contains('split-view');
    chrome.storage.local.set({ splitView: isSplitView });
  }
  
  function displayRawText() {
    if (currentText) {
      capturedTextElement.textContent = currentText;
      textModeToggle.checked = false;
    }
  }
  
  function displaySanitizedText() {
    if (currentText) {
      sanitizedText = sanitizeQuestionText(currentText);
      capturedTextElement.textContent = sanitizedText;
      textModeToggle.checked = true;
    }
  }
  
  function toggleTextMode() {
    if (this.checked) {
      displaySanitizedText();
    } else {
      displayRawText();
    }
  }
  
  function displayFormattedResponse(text) {
    aiResponseElement.textContent = text;
  }
  
  function updateProcessingStep(stepId, status) {
    const step = document.getElementById(stepId);
    step.className = 'process-step ' + status;
  }
  
  function loadHistory() {
    chrome.storage.local.get(['history'], function(result) {
      if (result.history && Array.isArray(result.history)) {
        historyEntries = result.history;
      }
    });
  }
  
  function renderHistoryEntries() {
    historyEntriesContainer.innerHTML = '';
    
    const filteredEntries = getFilteredHistory();
    
    if (filteredEntries.length === 0) {
      historyEntriesContainer.innerHTML = `
        <div class="empty-history-message">
          ${activeHistoryFilter === 'all' ? 'No history entries found' : 
            activeHistoryFilter === 'manual' ? 'No manual entries found' : 
            'No auto capture entries found'}
        </div>
      `;
      prevPageBtn.disabled = true;
      nextPageBtn.disabled = true;
      pageIndicator.textContent = 'Page 0 of 0';
      return;
    }
    
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
    
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    
    const startIdx = (currentPage - 1) * entriesPerPage;
    const endIdx = Math.min(startIdx + entriesPerPage, filteredEntries.length);
    for (let i = startIdx; i < endIdx; i++) {
      const entryId = `history-entry-${Date.now()}-${i}`;
      const entryEl = createHistoryEntryElement(filteredEntries[i], entryId);
      
      const headerEl = entryEl.querySelector(`.history-entry-header`);
      const contentEl = entryEl.querySelector(`#content-${entryId}`);
      const actionsEl = entryEl.querySelector(`#actions-${entryId}`);
      
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn-icon btn-toggle';
      toggleBtn.setAttribute('data-entry-id', entryId);
      toggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      `;
      headerEl.appendChild(toggleBtn);
      
      contentEl.classList.add('collapsed');
      actionsEl.classList.add('collapsed');
      
      toggleBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        event.preventDefault();
        
        const targetEntryId = this.getAttribute('data-entry-id');
        
        const contentToToggle = document.getElementById(`content-${targetEntryId}`);
        const actionsToToggle = document.getElementById(`actions-${targetEntryId}`);
        
        if (contentToToggle && actionsToToggle) {
          contentToToggle.classList.toggle('collapsed');
          actionsToToggle.classList.toggle('collapsed');
          this.classList.toggle('expanded');
          
          const svg = this.querySelector('svg');
          if (contentToToggle.classList.contains('collapsed')) {
            svg.style.transform = 'rotate(0deg)';
          } else {
            svg.style.transform = 'rotate(180deg)';
          }
        }
      });
      
      historyEntriesContainer.appendChild(entryEl);
    }
    
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  }
  
  function getFilteredHistory() {
    if (activeHistoryFilter === 'all') {
      return historyEntries;
    }
    
    return historyEntries.filter(entry => entry.type === activeHistoryFilter);
  }
  
  function createHistoryEntryElement(entry, entryId) {
    const entryEl = document.createElement('div');
    entryEl.className = 'history-entry';
    entryEl.id = entryId;
    
    if (entry.type === 'auto') {
      entryEl.classList.add('auto-capture-entry');
    }
    
    const timestamp = new Date(entry.timestamp);
    const formattedDate = timestamp.toLocaleDateString();
    const formattedTime = timestamp.toLocaleTimeString();
    
    const maxTextLength = 100;
    const truncatedText = entry.sanitizedText.length > maxTextLength 
      ? entry.sanitizedText.substring(0, maxTextLength) + '...'
      : entry.sanitizedText;
    
    const maxResponseLength = 150;
    const truncatedResponse = entry.aiResponse.length > maxResponseLength
      ? entry.aiResponse.substring(0, maxResponseLength) + '...'
      : entry.aiResponse;
    
    entryEl.innerHTML = `
      <div class="history-entry-header">
        <div class="history-entry-date">
          <span class="date">${formattedDate}</span>
          <span class="time">${formattedTime}</span>
        </div>
        <div class="history-entry-model">${entry.model}</div>
        ${entry.type === 'auto' ? '<div class="history-entry-badge">Auto</div>' : ''}
        ${entry.sentToTelegram ? '<div class="history-entry-badge telegram">Telegram</div>' : ''}
      </div>
      <div id="content-${entryId}" class="history-entry-content">
        <div class="history-entry-text">
          <div class="history-entry-title">Captured Text:</div>
          <p>${truncatedText}</p>
        </div>
        <div class="history-entry-response">
          <div class="history-entry-title">AI Response:</div>
          <p>${truncatedResponse}</p>
        </div>
      </div>
      <div id="actions-${entryId}" class="history-entry-actions">
        <button class="btn btn-small btn-view">View Full</button>
        <button class="btn btn-small btn-copy">Copy Response</button>
        ${!entry.sentToTelegram ? 
          '<button class="btn btn-small btn-telegram">Send to Telegram</button>' : ''}
      </div>
    `;
    
    const viewBtn = entryEl.querySelector('.btn-view');
    const copyBtn = entryEl.querySelector('.btn-copy');
    const telegramBtn = entryEl.querySelector('.btn-telegram');
    
    viewBtn.addEventListener('click', () => {
      viewHistoryEntry(entry);
    });
    
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(entry.aiResponse)
        .then(() => showStatusMessage('Response copied to clipboard', 'success'))
        .catch(err => showStatusMessage('Failed to copy: ' + err, 'error'));
    });
    
    if (telegramBtn) {
      telegramBtn.addEventListener('click', () => {
        sendHistoryEntryToTelegram(entry, telegramBtn);
      });
    }
    
    return entryEl;
  }
  
  function viewHistoryEntry(entry) {
    currentText = entry.rawText;
    sanitizedText = entry.sanitizedText;
    displayRawText();
    displayFormattedResponse(entry.aiResponse);
    
    chrome.storage.local.set({
      lastViewContext: {
        view: 'historyContent',
        filter: activeHistoryFilter,
        page: currentPage
      }
    });
    
    const actionBar = document.querySelector('.action-bar');
    if (actionBar) {
      const existingBackBtn = document.getElementById('backToHistoryBtn');
      if (existingBackBtn) {
        existingBackBtn.remove();
      }
      
      const backBtn = document.createElement('button');
      backBtn.id = 'backToHistoryBtn';
      backBtn.className = 'btn btn-secondary';
      backBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to History
      `;
      backBtn.addEventListener('click', backToHistory);
      
      actionBar.prepend(backBtn);
    }
    
    showContentView('mainContent');
    
    chrome.storage.local.set({
      capturedText: currentText,
      sanitizedText: sanitizedText,
      aiResponse: entry.aiResponse
    });
    
    updateProcessingStep('stepOCR', 'complete');
    updateProcessingStep('stepAI', 'complete');
  }
  
  function backToHistory() {
    chrome.storage.local.get(['lastViewContext'], function(result) {
      if (result.lastViewContext) {
        const { view, filter, page } = result.lastViewContext;
        
        if (filter) {
          activeHistoryFilter = filter;
          historyFilterButtons.forEach(btn => {
            const btnFilter = btn.id.replace('filter', '').toLowerCase();
            btn.classList.toggle('active', btnFilter === filter);
          });
        }
        
        if (page) {
          currentPage = page;
        }
        
        renderHistoryEntries();
        
        showContentView(view || 'historyContent');
        
        const backBtn = document.getElementById('backToHistoryBtn');
        if (backBtn) {
          backBtn.remove();
        }
      } else {
        showContentView('historyContent');
      }
    });
  }
  
  async function sendHistoryEntryToTelegram(entry, button) {
    if (!sessionKeys.telegramBotToken || !sessionKeys.telegramChatId) {
      showStatusMessage('Please configure Telegram in settings first', 'error');
      return;
    }
    
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending...';
    
    const entryCopy = {...entry, sentToTelegram: false};
    
    try {
      const success = await sendToTelegramAPI(entryCopy);
      
      if (success) {
        const index = historyEntries.findIndex(e => 
          e.timestamp === entry.timestamp && 
          e.rawText === entry.rawText);
        
        if (index !== -1) {
          historyEntries[index].sentToTelegram = true;
          chrome.storage.local.set({ history: historyEntries });
          
          const parentElement = button.closest('.history-entry');
          const newElement = createHistoryEntryElement(historyEntries[index]);
          parentElement.replaceWith(newElement);
        }
        
        showStatusMessage('Sent to Telegram successfully', 'success');
      } else {
        button.disabled = false;
        button.textContent = originalText;
        showStatusMessage('Failed to send to Telegram', 'error');
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = originalText;
      showStatusMessage('Error sending to Telegram: ' + error.message, 'error');
    }
  }
  
  function exportHistory() {
    const historyJson = JSON.stringify(historyEntries, null, 2);
    const blob = new Blob([historyJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const filename = `text_analyzer_history_${timestamp}.json`;
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
  }
  
  function clearAllHistory() {
    historyEntries = [];
    chrome.storage.local.set({ history: [] });
    renderHistoryEntries();
    showStatusMessage('History cleared', 'success');
  }
  
  function saveSettings() {
    const chatgptKey = chatgptApiKeyInput.value.trim();
    const geminiKey = geminiApiKeyInput.value.trim();
    const telegramToken = telegramBotTokenInput.value.trim();
    const telegramChatId = telegramChatIdInput.value.trim();
    
    sessionKeys.chatgptApiKey = chatgptKey;
    sessionKeys.geminiApiKey = geminiKey;
    sessionKeys.telegramBotToken = telegramToken;
    sessionKeys.telegramChatId = telegramChatId;
    
    if (!doNotStoreKeysCheckbox.checked) {
      chrome.storage.local.set({
        chatgptApiKey: chatgptKey,
        geminiApiKey: geminiKey,
        telegramBotToken: telegramToken,
        telegramChatId: telegramChatId,
        doNotStoreKeys: false
      });
    } else {
      chrome.storage.local.set({
        chatgptApiKey: '',
        geminiApiKey: '',
        telegramBotToken: '',
        telegramChatId: '',
        doNotStoreKeys: true
      });
    }
    
    const displayMode = document.querySelector('input[name="displayMode"]:checked').value;
    chrome.storage.local.set({
      displayMode: displayMode,
      rememberLastMode: rememberLastModeCheckbox.checked
    });
    
    showStatusMessage('Settings saved successfully', 'success');
    
    showContentView('mainContent');
    
    const hasTelegramConfig = sessionKeys.telegramBotToken && sessionKeys.telegramChatId;
    if (!hasTelegramConfig && sendToTelegram.checked) {
      telegramNotConfigured.classList.remove('hidden');
    } else {
      telegramNotConfigured.classList.add('hidden');
    }
    
    validateAutoCaptureForm();
  }
  
  async function testTelegramConnection() {
    const token = telegramBotTokenInput.value.trim();
    const chatId = telegramChatIdInput.value.trim();
    
    if (!token || !chatId) {
      telegramTestResult.textContent = 'Please enter both Bot Token and Chat ID';
      telegramTestResult.className = 'test-result error';
      return;
    }
    
    telegramTestResult.textContent = 'Testing connection...';
    telegramTestResult.className = 'test-result';
    testTelegramConnectionBtn.disabled = true;
    
    try {
      const testMessage = `Test connection from Text Analyzer Extension - ${new Date().toLocaleString()}`;
      
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: testMessage
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        telegramTestResult.textContent = 'Connection successful! Test message sent.';
        telegramTestResult.className = 'test-result success';
      } else {
        telegramTestResult.textContent = `Error: ${data.description}`;
        telegramTestResult.className = 'test-result error';
      }
    } catch (error) {
      telegramTestResult.textContent = `Connection error: ${error.message}`;
      telegramTestResult.className = 'test-result error';
    } finally {
      testTelegramConnectionBtn.disabled = false;
    }
  }
});