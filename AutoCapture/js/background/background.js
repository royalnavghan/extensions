/**
 * Text Analyzer Extension Background Script
 * @author Santhosh Kumar Reddy
 * @license MIT
 * @version 1.0.0
 */
const API_ENDPOINTS = {
  chatgpt: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  gemini_thinking: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent'
};

const MODEL_CONFIGS = {
  chatgpt: {
    displayName: 'ChatGPT',
    maxTokens: 1000,
    temperature: 0.7
  },
  gemini: {
    displayName: 'Gemini 2.0 Flash',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.95,
    topK: 40
  },
  gemini_thinking: {
    displayName: 'Gemini 2.0 Flash Thinking',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.95,
    topK: 64
  }
};

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel) {
    chrome.sidePanel.setOptions({
      path: 'js/side_panel/side_panel.html',
      enabled: true
    });
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.displayMode && changes.displayMode.newValue === 'sidePanel') {
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_display_mode') {
    chrome.storage.local.get(['displayMode'], (result) => {
      const currentMode = result.displayMode || 'sidePanel';
      const newMode = currentMode === 'sidePanel' ? 'fullScreen' : 'sidePanel';
      if (newMode === 'sidePanel' && chrome.sidePanel) {
        chrome.windows.getCurrent(function(window) {
          chrome.sidePanel.open({
            windowId: window.id
          });
        });
      }
      chrome.storage.local.set({displayMode: newMode}, () => {
        if (newMode === 'fullScreen') {
          chrome.tabs.create({url: chrome.runtime.getURL('js/fullscreen/fullscreen.html')});
        }
      });
    });
  }
});

importScripts('../utils/promptUtils.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processText') {
    processTextWithAI(request.text, request.model, request.apiKey)
      .then(response => sendResponse({ text: response }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else if (request.action === 'callGeminiWithImage') {
    callGeminiWithImage(request.imageBase64, request.apiKey, request.modelType)
      .then(text => sendResponse({ text }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else if (request.action === 'injectContentScript') {
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      files: ['js/content/content-script.js']
    }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ 
        success: false, 
        error: error.message
      });
    });
    return true;
  }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url && (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))) {
      chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        files: ['js/content/content-script.js']
      }).catch(error => {
      });
    }
  });
});

async function processTextWithAI(text, model, apiKey) {
  try {
    if (!apiKey) {
      const provider = model.startsWith('gemini') ? 'Gemini' : (model === 'chatgpt' ? 'OpenAI' : 'AI provider');
      throw new Error(`Please set your ${provider} API key in the settings.`);
    }
    
    if (model === 'chatgpt') {
      return await callChatGPT(text, apiKey);
    } else if (model.startsWith('gemini')) {
      return await callGemini(text, apiKey, model);
    } else {
      throw new Error('Unsupported AI model');
    }
  } catch (error) {
    throw error;
  }
}

async function callChatGPT(text, apiKey) {
  try {
    const prompt = getTextAnalysisPrompt(text);
    const config = MODEL_CONFIGS.chatgpt;
    
    const response = await fetch(API_ENDPOINTS.chatgpt, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'ChatGPT API error');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    throw error;
  }
}

async function callGemini(text, apiKey, modelType = 'gemini') {
  try {
    const prompt = getTextAnalysisPrompt(text);
    const config = MODEL_CONFIGS[modelType] || MODEL_CONFIGS.gemini;
    const endpoint = API_ENDPOINTS[modelType] || API_ENDPOINTS.gemini;
    
    const url = `${endpoint}?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: config.temperature,
          topP: config.topP,
          topK: config.topK,
          maxOutputTokens: config.maxTokens
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `${config.displayName} API error`);
    }
    
    const data = await response.json();
    
    if (data.candidates && 
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error(`Received unexpected response format from ${config.displayName} API`);
    }
  } catch (error) {
    throw error;
  }
}

async function callGeminiWithImage(imageBase64, apiKey, modelType = 'gemini') {
  try {
    const endpoint = API_ENDPOINTS[modelType];
    const config = MODEL_CONFIGS[modelType];
    
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const requestData = {
      contents: [{
        parts: [
          {
            text: "Please extract ALL text from this image. First, provide the complete raw text extraction of everything visible in the image, and then separately structure it as follows if possible:\n\nQUESTION:\n[The question text]\n\nOPTIONS:\nA. [First option]\nB. [Second option]\nC. [Third option]\nD. [Fourth option]\n\nDo not omit any visible text in the raw extraction, include everything even if it seems irrelevant."
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1, 
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        stopSequences: [] 
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        }
      ]
    };

    const apiEndpoint = API_ENDPOINTS.gemini;
    
    const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      if (data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        const text = data.candidates[0].content.parts[0].text;
        if (text) {
          return text;
        }
      } else if (data.candidates[0].text) {
        return data.candidates[0].text;
      } else if (data.text) {
        return data.text;
      }
      
      if (data.candidates[0].finishReason === "RECITATION") {
        return "No text was extracted from the image. The model processed the image but did not return any text content.";
      }
      
      throw new Error('Response contained candidates but no text content');
    }
    
    throw new Error('No valid response from Gemini API. Response: ' + JSON.stringify(data));
  } catch (error) {
    throw error;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  
  chrome.storage.local.get(['chatgptApiKey', 'geminiApiKey', 'doNotStoreKeys'], (data) => {
    const defaults = {};
    
    if (data.doNotStoreKeys === undefined) {
      defaults.doNotStoreKeys = false;
    }
    
    if (!data.chatgptApiKey) {
      defaults.chatgptApiKey = '';
    }
    
    if (!data.geminiApiKey) {
      defaults.geminiApiKey = '';
    }
    
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });
});

chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
  if (item.byExtensionId === chrome.runtime.id) {
    suggest({filename: item.filename});
  }
}); 