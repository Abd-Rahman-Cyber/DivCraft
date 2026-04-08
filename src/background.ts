// DivCraft - Background Script (Manifest V3)

function isScriptableUrl(url?: string): boolean {
  if (!url) return false;
  return !url.startsWith('chrome://') && 
         !url.startsWith('chrome-extension://') && 
         !url.startsWith('https://chrome.google.com/webstore') &&
         !url.startsWith('https://chromewebstore.google.com');
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id || !isScriptableUrl(tab.url)) return;

  console.log('DivCraft: Action clicked, toggling selection on tab', tab.id);
  // Send a message to the content script to toggle selection
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SELECTION' }).catch(() => {
    console.log('DivCraft: Content script not found, injecting...');
    // If the content script isn't loaded yet, inject it.
    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ['content.js']
    }).then(() => {
      console.log('DivCraft: Content script injected, waiting to send message');
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id!, { type: 'TOGGLE_SELECTION' })
          .then(res => console.log('DivCraft: Selection toggled after injection', res))
          .catch(err => console.error('DivCraft: Failed to toggle after injection', err));
      }, 200);
    }).catch(err => console.error('DivCraft: Failed to inject script:', err));
  });
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('DivCraft: Background received message:', message.type);
  
  if (message.type === 'START_SELECTION') {
    const tabId = message.tabId;
    if (!tabId) {
      console.error('DivCraft: No tabId provided for START_SELECTION');
      return;
    }

    chrome.tabs.get(tabId, (tab) => {
      if (!isScriptableUrl(tab.url)) {
        console.warn('DivCraft: Cannot select on non-scriptable URL:', tab.url);
        return;
      }

      console.log('DivCraft: Starting selection on tab', tabId);
      chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_SELECTION' })
        .then(res => {
          console.log('DivCraft: Selection toggled', res);
          sendResponse({ success: true });
        })
        .catch(() => {
          console.log('DivCraft: Content script not found, injecting...');
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
          }).then(() => {
            console.log('DivCraft: Content script injected, waiting to send message');
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_SELECTION' })
                .then(res => console.log('DivCraft: Selection toggled after injection', res))
                .catch(err => console.error('DivCraft: Failed to toggle after injection', err));
            }, 200);
            sendResponse({ success: true });
          }).catch(err => {
            console.error('DivCraft: Failed to inject script:', err);
            sendResponse({ success: false, error: err.message });
          });
        });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'OPEN_EDITOR') {
    console.log('DivCraft: Opening editor with data', message.data ? 'present' : 'missing');
    
    if (!message.data) {
      console.error('DivCraft: No data provided for OPEN_EDITOR');
      return;
    }

    chrome.storage.local.set({ lastExtractedData: message.data }, () => {
      const editorUrl = chrome.runtime.getURL('index.html') + '?editor=true';
      console.log('DivCraft: Creating editor tab with URL:', editorUrl);
      
      chrome.tabs.create({ url: editorUrl }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('DivCraft: Failed to create tab:', chrome.runtime.lastError);
        } else {
          console.log('DivCraft: Editor tab created successfully', tab.id);
        }
      });
    });
    return true;
  }
});
