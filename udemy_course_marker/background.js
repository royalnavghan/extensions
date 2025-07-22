/**
 * Udemy Course Marker Extension - Background Service Worker
 * Author: Santhosh Kumar Reddy
 */

// Add handler for extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel when the extension icon is clicked
  chrome.sidePanel.open({ windowId: tab.windowId })
    .catch(error => {
      console.error('Error opening side panel:', error);
    });
});

// Add handler for setting up side panel behavior
chrome.runtime.onInstalled.addListener(() => {
  // Set side panel behavior to open on every page
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Error setting panel behavior:', error));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  if (tab.url && (
    tab.url.includes('udemy.com/course') || 
    tab.url.includes('udemy.com/organization') ||
    tab.url.includes('udemy.com/learn')
  )) {
    if (changeInfo.status === 'complete') {

      chrome.storage.local.set({
        'activeUdemyTab': {
          id: tabId,
          url: tab.url,
          title: tab.title,
          timestamp: Date.now()
        }
      });


      chrome.runtime.sendMessage({
        action: 'udemyTabUpdated',
        tabId: tabId,
        url: tab.url,
        title: tab.title
      }).catch(() => {

        console.log('Popup not available to receive udemyTabUpdated message');
      });
    }
  }
});


const injectionScripts = {

  helperFunctions: function() {

    window.udemyHelpers = {

      $x: function(path) {
        const result = document.evaluate(
          path, document, null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        );
        
        const nodes = [];
        for (let i = 0; i < result.snapshotLength; i++) {
          nodes.push(result.snapshotItem(i));
        }
        return nodes;
      },
      

      sendResult: function(result) {
        try {
          window.postMessage({ 
            type: 'FROM_PAGE_SCRIPT', 
            result: result 
          }, '*');
        } catch (e) {
          console.error('Error sending result:', e);
        }
      }
    };
    

    window.addEventListener('message', function(event) {
      try {
        if (event.data && event.data.type === 'FROM_PAGE_SCRIPT') {
          chrome.runtime.sendMessage({
            action: 'scriptResult',
            result: event.data.result
          }).catch(function(err) {
            console.error('Error sending message to extension:', err);
          });
        }
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
    
    return true;
  },
  

  expandSections: function() {
    try {
      console.log('Expanding all sections...');
      const sectionSelectors = [
        ".ud-accordionpanel-title",
        ".ud-accordion-panel-toggler",
        "[data-purpose='section-heading-toggle']",
        ".accordion-panel-module--title--yUnWN",
        "[data-purpose='section-panel-title']"
      ];
      
      let expandedCount = 0;
      let sections = [];
      

      for (const selector of sectionSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} sections with selector: ${selector}`);
          sections = elements;
          break;
        }
      }
      

      if (sections.length === 0) {
        sections = window.udemyHelpers.$x("//div[contains(@class, 'ud-accordion-panel')]//button[contains(@class, 'ud-accordion-panel-toggler')]");
        console.log(`Found ${sections.length} sections with XPath`);
      }
      

      Array.from(sections).forEach((section, index) => {
        try {
          const isCollapsed = !section.closest('.ud-accordion-panel')?.classList.contains('ud-accordion-panel--expanded');
          if (isCollapsed) {
            section.click();
            expandedCount++;
          }
        } catch (err) {
          console.error('Error clicking section:', err);
        }
      });
      
      return { 
        success: true, 
        message: `${expandedCount} sections expanded.`
      };
    } catch (error) {
      console.error('Error expanding sections:', error);
      return { 
        success: false, 
        error: error.message || 'Error expanding sections' 
      };
    }
  },
  

  uncheckWatchedVideos: function() {
    try {
      console.log('Unchecking all seen videos...');
      const selectors = [
        "input[type='checkbox']:checked",
        "[data-purpose='progress-toggle-button'][aria-checked='true']",
        ".ud-custom-checkbox-checked",
        ".video-marker.checked"
      ];
      
      let allCheckedBoxes = [];
      

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          allCheckedBoxes = [...allCheckedBoxes, ...elements];
        }
      }
      
      let uncheckedCount = 0;
      allCheckedBoxes.forEach(checkbox => {
        try {
          checkbox.click();
          uncheckedCount++;
        } catch (err) {
          console.error('Error unchecking element:', err);
        }
      });
      
      return { 
        success: true, 
        message: `${uncheckedCount} videos unchecked.`
      };
    } catch (error) {
      console.error('Error unchecking videos:', error);
      return { 
        success: false, 
        error: error.message || 'Error unchecking videos'
      };
    }
  },
  

  markAllVideos: function() {
    try {
      console.log('Marking all videos as watched...');
      

      console.log('Step 1: Expanding all sections...');
      const expandSections = () => {

        const sections = window.udemyHelpers.$x("/html/body/div[1]/div[1]/div/div/main/div/div[2]/section/div[2]/div/div/div/div[1]");
        console.log(`Found ${sections.length} sections with direct XPath`);
        

        sections.forEach(el => {
          try {
            el.click();
          } catch (err) {
            console.error('Error clicking section:', err);
          }
        });
        
        return sections.length;
      };
      
      const expandedCount = expandSections();
      

      setTimeout(() => {

        console.log('Step 2: Unchecking seen videos...');
        const checkedBoxes = document.querySelectorAll("input[type='checkbox']:checked");
        console.log(`Found ${checkedBoxes.length} checked videos`);
        
        checkedBoxes.forEach(checkbox => {
          try {
            checkbox.click();
          } catch (err) {
            console.error('Error unchecking video:', err);
          }
        });
        

        setTimeout(() => {

          console.log('Step 3: Checking all videos...');
          const allBoxes = document.querySelectorAll("input[type='checkbox']");
          console.log(`Found ${allBoxes.length} videos to check`);
          
          let checkedCount = 0;
          allBoxes.forEach(checkbox => {
            try {
              if (!checkbox.checked) {
                checkbox.disabled = false;
                checkbox.click();
                checkedCount++;
              }
            } catch (err) {
              console.error('Error checking video:', err);
            }
          });
          
          console.log('Completed. All videos are marked as seen.');

          window.udemyHelpers.sendResult({ 
            success: true, 
            message: `${checkedCount} videos marked as watched.`,
            expandedCount: expandedCount
          });
        }, 1000);
      }, 1000);
      

      return { 
        success: true, 
        message: "Processing videos..."
      };
    } catch (error) {
      console.error('Error marking videos:', error);
      return { 
        success: false, 
        error: error.message || 'Error marking videos'
      };
    }
  },
  

  checkSSOStatus: function() {
    try {

      const isLoggedIn = document.querySelector('.ud-component--header--header') !== null ||
                       document.querySelector('.desktop--header--1lJjO') !== null;
      

      const isSSOLogin = document.querySelector('.sso-login') !== null || 
                       document.cookie.includes('ud_sso') ||
                       document.cookie.includes('ud_cache_language') ||
                       window.location.href.includes('/organization/') ||
                       document.querySelector('.ud-component--organization-common--organization-context') !== null;
      
      return { isLoggedIn, isSSOLogin };
    } catch (error) {
      console.error('Error checking SSO status:', error);
      return { 
        success: false, 
        error: error.message
      };
    }
  }
};


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === 'scriptResult') {

    chrome.runtime.sendMessage(message).catch(() => {

      console.log('Popup not available to receive script result');
    });
    sendResponse({ received: true });
    return true;
  }
  
  if (message.action === 'getActiveUdemyTabs') {

    chrome.tabs.query({ 
      url: [
        "*://*.udemy.com/*/course/*",
        "*://*.udemy.com/course/*",
        "*://*.udemy.com/learn/*",
        "*://*.udemy.com/organization/*"
      ]
    }, (tabs) => {
      sendResponse({ tabs: tabs });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'executeInTab') {
    try {
      const tabId = message.tabId;
      const scriptType = message.scriptType;
      

    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: injectionScripts.helperFunctions
      }).then(() => {

        if (scriptType === 'expandSections') {
          return chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: injectionScripts.expandSections
          });
        } else if (scriptType === 'uncheckWatchedVideos') {
          return chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: injectionScripts.uncheckWatchedVideos
          });
        } else if (scriptType === 'markAllVideos') {
          return chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: injectionScripts.markAllVideos
          });
        } else {
          throw new Error('Unknown script type: ' + scriptType);
        }
      }).then(results => {
        if (results && results[0] && results[0].result) {
          sendResponse(results[0].result);
        } else {
          sendResponse({ 
            success: false, 
            error: 'Invalid result from script execution' 
          });
        }
    }).catch(error => {
      console.error('Error executing script:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Error executing script' 
        });
      });
    } catch (mainError) {
      console.error('Main execution error:', mainError);
      sendResponse({ 
        success: false, 
        error: mainError.message || 'Failed to execute script' 
      });
    }
    return true; // Required for async response
  }
  
  if (message.action === 'checkSSOStatus') {

    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      func: injectionScripts.checkSSOStatus
    }).then(result => {
      if (result && result[0] && result[0].result) {
      sendResponse({ success: true, result: result[0].result });
      } else {
        sendResponse({ 
          success: false, 
          error: 'Invalid result from SSO check' 
        });
      }
    }).catch(error => {
      console.error('Error checking SSO status:', error);
      sendResponse({ success: false, error: error.message || 'Error checking SSO status' });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'progressUpdate') {

    chrome.runtime.sendMessage(message).catch(() => {

    });
    return true;
  }
}); 
