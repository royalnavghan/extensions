/**
 * Text Analyzer Extension Content Script
 * @author Santhosh Kumar Reddy
 * @license MIT
 * @version 1.0.0
 * 
 * This content script is injected into web pages to help with text extraction
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractText') {
    try {
      const bodyText = document.body.innerText;
      const visibleText = getVisibleText();
      const selectedText = window.getSelection().toString();
      
      sendResponse({
        success: true,
        bodyText: bodyText,
        visibleText: visibleText,
        selectedText: selectedText
      });
    } catch (error) {
      console.error('Text extraction error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
    return true;
  }
});

function getVisibleText() {
  const textElements = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    const element = node.parentElement;
    if (element && isVisible(element)) {
      textElements.push(node);
    }
  }
  
  return textElements
    .map(node => node.textContent.trim())
    .filter(text => text.length > 0)
    .join('\n');
}

/**
 * Check if an element is visible in the viewport
 * @param {Element} element - DOM element to check
 * @returns {boolean} Whether the element is visible
 */
function isVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
} 