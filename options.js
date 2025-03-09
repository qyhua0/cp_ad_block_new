document.addEventListener("DOMContentLoaded", () => {
  // 获取所有必要的DOM元素
  const adList = document.getElementById("adList");
  const saveButton = document.getElementById("saveButton");
  const exportButton = document.getElementById("exportButton");
  const importButton = document.getElementById("importButton");
  const importFile = document.getElementById("importFile");
  const toggleButton = document.getElementById("toggleButton");
  const sidebarItems = document.querySelectorAll(".sidebar li");
  const contentSections = document.querySelectorAll(".content section");

  // 检查元素是否正确获取
  if (!adList || !saveButton || !exportButton || !importButton || !importFile || !toggleButton) {
    console.error("One or more elements are missing:", {
      adList, saveButton, exportButton, importButton, importFile, toggleButton
    });
    return;
  }

  // 设置多语言文本
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const messageKey = element.getAttribute("data-i18n");
    if (messageKey) {
      element.textContent = chrome.i18n.getMessage(messageKey);
    } else {
      console.warn("Missing data-i18n attribute on element:", element);
    }
  });
  const placeholderKey = adList.getAttribute("data-i18n-placeholder");
  if (placeholderKey) {
    adList.placeholder = chrome.i18n.getMessage(placeholderKey);
  } else {
    adList.placeholder = "Enter domains to block, one per line (e.g., ad1.com)";
  }

  // 加载开关状态
  chrome.storage.sync.get("isEnabled", (data) => {
    const isEnabled = data.isEnabled !== false;
    toggleButton.textContent = chrome.i18n.getMessage(isEnabled ? "toggleDisable" : "toggleEnable");
  });

  // 加载广告列表
  chrome.storage.sync.get("customAdList", (data) => {
    let rawList = data.customAdList;
    if (!rawList || rawList.length === 0) {
      rawList = [];
    }
    adList.value = rawList.map(url => {
      if (url.startsWith("@@||") && url.endsWith("^")) {
        return url.replace("@@||", "@@").replace("^", "");
      } else if (url.startsWith("/") && url.endsWith("/")) {
        return url;
      } else if (url.startsWith("||") && url.endsWith("^")) {
        return url.replace("||", "").replace("^", "");
      }
      return url;
    }).join("\n");
  });

  // 切换菜单
  sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
      sidebarItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      contentSections.forEach(section => section.classList.remove("active"));
      const targetSection = document.getElementById(item.getAttribute("data-section"));
      if (targetSection) {
        targetSection.classList.add("active");
      }
    });
  });

  // 开关按钮逻辑
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

  // 保存广告列表
  saveButton.addEventListener("click", () => {
    const rawList = adList.value.split("\n").filter(line => line.trim() !== "");
    const formattedList = rawList.map(domain => {
      if (domain.startsWith("@@")) return `@@||${domain.slice(2)}^`;
      if (domain.startsWith("/") && domain.endsWith("/")) return domain;
      return `||${domain.trim()}^`;
    });
    chrome.storage.sync.set({ customAdList: formattedList }, () => {
      chrome.runtime.sendMessage({ action: "updateRules", isEnabled: true });
      alert("Saved!");
    });
  });

  // 导出规则
  exportButton.addEventListener("click", () => {
    const rawList = adList.value.split("\n").filter(line => line.trim() !== "");
    const blob = new Blob([rawList.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url: url, filename: "ad_block_list.txt", saveAs: true });
  });

  // 导入规则
  importButton.addEventListener("click", () => {
    importFile.click();
  });
  importFile.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        adList.value = e.target.result;
        const rawList = adList.value.split("\n").filter(line => line.trim() !== "");
        const formattedList = rawList.map(domain => {
          if (domain.startsWith("@@")) return `@@||${domain.slice(2)}^`;
          if (domain.startsWith("/") && domain.endsWith("/")) return domain;
          return `||${domain.trim()}^`;
        });
        chrome.storage.sync.set({ customAdList: formattedList }, () => {
          chrome.runtime.sendMessage({ action: "updateRules", isEnabled: true });
          alert("Imported!");
        });
      };
      reader.readAsText(file);
    }
  });
});