chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
  });
  
  // Keep the popup open by disabling auto-close behavior
  chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
  });
  