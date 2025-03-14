// document.addEventListener('DOMContentLoaded', () => {
//     const toggleButton = document.getElementById('toggleButton');
  
//     // 加载保存的状态
//     chrome.storage.sync.get('isEnabled', (data) => {
//       const isEnabled = data.isEnabled !== false; // 默认启用
//       toggleButton.textContent = isEnabled ? 'Disable Ad Blocking' : 'Enable Ad Blocking';
//     });
  
//     // 切换启用/禁用状态
//     toggleButton.addEventListener('click', () => {
//       chrome.storage.sync.get('isEnabled', (data) => {
//         const isEnabled = data.isEnabled !== false;
//         const newState = !isEnabled;
//         chrome.storage.sync.set({ isEnabled: newState }, () => {
//           toggleButton.textContent = newState ? 'Disable Ad Blocking' : 'Enable Ad Blocking';
//           chrome.runtime.sendMessage({ action: 'updateRules', isEnabled: newState });
//         });
//       });
//     });
//   });


//支持多语言版本
  document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("toggleButton");
  
    // 设置初始多语言文本
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const messageKey = element.getAttribute("data-i18n");
      element.textContent = chrome.i18n.getMessage(messageKey);
    });
  
    // 动态更新按钮文本
    chrome.storage.sync.get("isEnabled", (data) => {
      const isEnabled = data.isEnabled !== false;
      toggleButton.textContent = chrome.i18n.getMessage(isEnabled ? "toggleDisable" : "toggleEnable");
    });
  
    toggleButton.addEventListener("click", () => {
      chrome.storage.sync.get("isEnabled", (data) => {
        const isEnabled = data.isEnabled !== false;
        const newState = !isEnabled;
        chrome.storage.sync.set({ isEnabled: newState }, () => {
          toggleButton.textContent = chrome.i18n.getMessage(newState ? "toggleDisable" : "toggleEnable");
          chrome.runtime.sendMessage({ action: "updateRules", isEnabled: newState });
        });
      });
    });
  });