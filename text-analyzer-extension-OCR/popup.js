/**
 * Text Analyzer Extension with OCR
 * Author: Santhosh Kumar Reddy
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
  

  const ocrApiKeyInput = document.getElementById('ocrApiKey');
  const chatgptApiKeyInput = document.getElementById('chatgptApiKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const doNotStoreKeysCheckbox = document.getElementById('doNotStoreKeys');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const cancelSettingsBtn = document.getElementById('cancelSettings');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  

  const historyEntriesContainer = document.getElementById('historyEntries');
  const backToMainBtn = document.getElementById('backToMain');
  const exportHistoryBtn = document.getElementById('exportHistory');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageIndicator = document.getElementById('pageIndicator');
  
  let sessionKeys = {
    ocrApiKey: '',
    chatgptApiKey: '',
    geminiApiKey: ''
  };
  
  let historyEntries = [];
  let currentPage = 1;
  const entriesPerPage = 10;
  
  initializeExtension();
  

  captureTextBtn.addEventListener('click', captureAndAnalyzeScreen);
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
    capturedTextElement.innerHTML = '<p class="placeholder">Captured text will appear here</p>';
    updateStepStatus(stepOCR, 'waiting', 'Waiting');
    chrome.storage.local.remove('capturedText', function() {
      setStatus('Text cleared');
    });
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
        case 'T': captureAndAnalyzeScreen(); break;
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
    chrome.storage.local.get(['capturedText', 'aiResponse', 'selectedModel'], (result) => {
      if (result.capturedText) {
        capturedTextElement.innerHTML = result.capturedText;
        updateStepStatus(stepOCR, 'completed', 'Completed');
      }
      
      if (result.aiResponse) {
        aiResponseElement.innerHTML = result.aiResponse;
        updateStepStatus(stepAI, 'completed', 'Completed');
      }
      
      if (result.selectedModel) {
        aiModelSelect.value = result.selectedModel;
      }
    });
  }
  
  function loadSettings() {
    chrome.storage.local.get(['ocrApiKey', 'chatgptApiKey', 'geminiApiKey', 'doNotStoreKeys'], (result) => {
      if (result.ocrApiKey) {
        sessionKeys.ocrApiKey = result.ocrApiKey;
        ocrApiKeyInput.value = result.ocrApiKey;
      }
      
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
    sessionKeys.ocrApiKey = ocrApiKeyInput.value;
    sessionKeys.chatgptApiKey = chatgptApiKeyInput.value;
    sessionKeys.geminiApiKey = geminiApiKeyInput.value;
    
    if (!doNotStoreKeysCheckbox.checked) {
      chrome.storage.local.set({
        ocrApiKey: sessionKeys.ocrApiKey,
        chatgptApiKey: sessionKeys.chatgptApiKey,
        geminiApiKey: sessionKeys.geminiApiKey,
        doNotStoreKeys: false
      });
      showHapticFeedback('success');
    } else {
      chrome.storage.local.set({
        ocrApiKey: '',
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
        callback(response.result);
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
  
  function captureAndAnalyzeScreen() {
    try {
      setStatus('Capturing screen...');
      updateStepStatus(stepOCR, 'in-progress', 'In Progress');
      capturedTextElement.innerHTML = '<p>Capturing screen content...</p>';
      capturedTextElement.classList.add('loading-shimmer');
      
      chrome.tabs.captureVisibleTab({ format: 'png' }, function(imageUrl) {
        if (chrome.runtime.lastError) {
          handleError('Failed to capture screen', chrome.runtime.lastError.message);
          showHapticFeedback('error');
          return;
        }
        
        const ocrApiKey = sessionKeys.ocrApiKey;
        
        if (!ocrApiKey) {
          handleError('API Key Required', 'Please set your OCR Space API key in the settings.');
          capturedTextElement.classList.remove('loading-shimmer');
          showHapticFeedback('error');
          return;
        }
        
        extractTextFromImage(imageUrl, ocrApiKey, function(text, error) {
          if (error) {
            capturedTextElement.classList.remove('loading-shimmer');
            handleError('OCR Error', error);
            showHapticFeedback('error');
            return;
          }
          
          capturedTextElement.classList.remove('loading-shimmer');
          capturedTextElement.innerText = text;
          chrome.storage.local.set({ capturedText: text });
          
          setStatus('Text extracted successfully');
          updateStepStatus(stepOCR, 'completed', 'Completed');
          showHapticFeedback('success');
          
          setStatus('Processing with AI...');
          updateStepStatus(stepAI, 'in-progress', 'In Progress');
          aiResponseElement.innerHTML = '<p>Analyzing text with AI...</p>';
          aiResponseElement.classList.add('loading-shimmer');
          
          const model = aiModelSelect.value;
          let apiKey = model === 'chatgpt' ? sessionKeys.chatgptApiKey : sessionKeys.geminiApiKey;
          
          if (!apiKey) {
            const provider = model === 'chatgpt' ? 'OpenAI' : 'Gemini';
            handleError('API Key Required', `Please set your ${provider} API key in the settings.`);
            aiResponseElement.classList.remove('loading-shimmer');
            showHapticFeedback('error');
            return;
          }
          
          processWithAI(text, model, apiKey, function(aiResponse, error) {
            aiResponseElement.classList.remove('loading-shimmer');
            
            if (error) {
              handleError('AI Processing Error', error);
              showHapticFeedback('error');
              return;
            }
            
            const formattedResponse = displayFormattedResponse(aiResponse);
            aiResponseElement.innerHTML = `<div class="markdown-content">${formattedResponse}</div>`;
            chrome.storage.local.set({ aiResponse: aiResponseElement.innerHTML });
            
            setStatus('Analysis completed');
            updateStepStatus(stepAI, 'completed', 'Completed');
            showHapticFeedback('success');
            addToHistory(text, aiResponse, model);
          });
        });
      });
    } catch (error) {
      handleError('Capture Error', error.message);
      showHapticFeedback('error');
    }
  }
  
  function extractTextFromImage(imageUrl, apiKey, callback) {
    const blob = dataURItoBlob(imageUrl);
    const formData = new FormData();
    formData.append('file', blob, 'screenshot.png');
    formData.append('apikey', apiKey);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    
    fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.IsErroredOnProcessing) {
        handleError('OCR API error', data.ErrorMessage);
        callback(null, data.ErrorMessage);
        return;
      }
      
      if (data.ParsedResults && data.ParsedResults.length > 0) {
        callback(data.ParsedResults[0].ParsedText, null);
      } else {
        handleError('No text found in the image');
        callback(null, 'No text found in the image');
      }
    })
    .catch(error => {
      handleError('Error calling OCR API', error);
      callback(null, error.message);
    });
  }
  
  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], {type: mimeString});
  }
  
  function handleError(message, details) {
    console.error(message, details);
    setStatus(`Error: ${message}`);
    loader.classList.remove('active');
    updateStepStatus(stepOCR, 'error', 'Error');
    updateStepStatus(stepAI, 'error', 'Error');
    showHapticFeedback('error');
  }
  
  function setStatus(message) {
    statusMessage.textContent = message;
  }
  
  function updateStepStatus(stepElement, statusClass, text) {
    stepElement.querySelector('.step-status').className = `step-status ${statusClass}`;
    stepElement.querySelector('.step-status').textContent = text;
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
    chrome.storage.local.get(['history'], function(data) {
      if (data.history && Array.isArray(data.history)) {
        historyEntries = data.history;
      }
    });
  }
  
  function addToHistory(capturedText, aiResponse, model) {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      capturedText: capturedText,
      aiResponse: aiResponse,
      model: model
    };
    
    historyEntries.unshift(entry);
    chrome.storage.local.set({history: historyEntries});
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
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16" class="empty-icon">
            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
            <path d="M8 1a7 7 0 1 0 4.95 11.95.5.5 0 0 1 .707.707A8 8 0 1 1 8 0a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M8 4.5a.5.5 0 0 1 .5.5v3.5a.5.5 0 0 1-.5.5H5a.5.5 0 0 1 0-1h2.5V5a.5.5 0 0 1 .5-.5z"/>
          </svg>
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
      entryElement.dataset.id = entry.id;
      
      const truncatedCapturedText = truncateText(entry.capturedText, 300);
      const truncatedAiResponse = truncateText(entry.aiResponse, 300);
      
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
            <span class="entry-model ${entry.model}">${entry.model === 'chatgpt' ? 'ChatGPT' : 'Gemini'}</span>
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
        </div>
      `;
      
      historyEntriesContainer.appendChild(entryElement);
      
      const headerElement = entryElement.querySelector('.entry-header');
      headerElement.addEventListener('click', function() {
        entryElement.classList.toggle('expanded');
      });
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
      
      exportText += `## Entry ${index + 1} - ${formattedDate} (${entry.model === 'chatgpt' ? 'ChatGPT' : 'Gemini'})\n\n`;
      exportText += `### Captured Text:\n${entry.capturedText}\n\n`;
      exportText += `### AI Response:\n${entry.aiResponse}\n\n`;
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
    chrome.storage.local.set({history: []});
    renderHistoryEntries();
    setStatus('History cleared');
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
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }
}); 
