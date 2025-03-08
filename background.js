// 默认广告规则
const defaultRules = [
    {
      id: 1,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '||example-ads.com^',
        resourceTypes: ['script', 'image']
      }
    }
  ];
  
  // 初始化规则 不支持第三方允许规则 @@
  function updateRules_20250306(isEnabled, customAdList = []) {
    const rules = isEnabled ? [...defaultRules, ...customAdList.map((url, index) => ({
      id: index + 2, // 从2开始，避免与默认规则冲突
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: url, // 直接使用格式化后的URL
        resourceTypes: ['script', 'image', 'stylesheet', 'main_frame', 'sub_frame']
      }
    }))] : [];
  
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from({ length: defaultRules.length + customAdList.length }, (_, i) => i + 1),
      addRules: rules
    });
  }


   // 初始化规则 增加兼容支持第3方允许规则标识@@
function updateRules(isEnabled, customAdList = []) {
    const rules = isEnabled ? [
      ...defaultRules,
      ...customAdList.map((url, index) => {
        const isException = url.startsWith('@@');
        const cleanUrl = isException ? url.slice(2) : url;
        return {
          id: index + 2,
          priority: isException ? 2 : 1, // 例外优先级更高
          action: { type: isException ? 'allow' : 'block' },
          condition: {
            urlFilter: cleanUrl,
            resourceTypes: ['script', 'image', 'stylesheet', 'main_frame', 'sub_frame']
          }
        };
      })
    ] : [];
  
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from({ length: defaultRules.length + customAdList.length }, (_, i) => i + 1),
      addRules: rules
    });
  }
  
  // 安装时加载初始状态
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['isEnabled', 'customAdList'], (data) => {
      const isEnabled = data.isEnabled !== false; // 默认启用
      const customAdList = data.customAdList || [];
      updateRules(isEnabled, customAdList);
    });
  });
  
  // 监听消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateRules') {
      chrome.storage.sync.get('customAdList', (data) => {
        const customAdList = data.customAdList || [];
        updateRules(message.isEnabled, customAdList);
      });
    }
  });