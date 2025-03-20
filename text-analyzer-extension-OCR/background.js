/**
 * Text Analyzer Extension with OCR
 * Author: Santhosh Kumar Reddy
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

importScripts('prompts/promptUtils.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processText') {
    (async () => {
      try {
        const result = await processTextWithAI(request.text, request.model, request.apiKey);
        sendResponse({ result });
      } catch (error) {
        console.error('Error processing text:', error);
        sendResponse({ error: error.message || 'Failed to process text' });
      }
    })();
    
    return true;
  }
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
    console.error('Error in processTextWithAI:', error);
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
    console.error('Error calling ChatGPT:', error);
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
      console.error(`Unexpected ${config.displayName} API response structure:`, data);
      throw new Error(`Received unexpected response format from ${config.displayName} API`);
    }
  } catch (error) {
    console.error(`Error calling ${modelType}:`, error);
    throw error;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Text Analyzer with OCR extension installed');
  
  chrome.storage.local.get(['ocrApiKey', 'chatgptApiKey', 'geminiApiKey', 'doNotStoreKeys'], (data) => {
    const defaults = {};
    
    if (data.doNotStoreKeys === undefined) {
      defaults.doNotStoreKeys = false;
    }
    
    if (!data.ocrApiKey) {
      defaults.ocrApiKey = '';
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
