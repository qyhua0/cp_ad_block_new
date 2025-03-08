document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleButton');
  
    // 加载保存的状态
    chrome.storage.sync.get('isEnabled', (data) => {
      const isEnabled = data.isEnabled !== false; // 默认启用
      toggleButton.textContent = isEnabled ? 'Disable Ad Blocking' : 'Enable Ad Blocking';
    });
  
    // 切换启用/禁用状态
    toggleButton.addEventListener('click', () => {
      chrome.storage.sync.get('isEnabled', (data) => {
        const isEnabled = data.isEnabled !== false;
        const newState = !isEnabled;
        chrome.storage.sync.set({ isEnabled: newState }, () => {
          toggleButton.textContent = newState ? 'Disable Ad Blocking' : 'Enable Ad Blocking';
          chrome.runtime.sendMessage({ action: 'updateRules', isEnabled: newState });
        });
      });
    });
  });