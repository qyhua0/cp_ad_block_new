document.addEventListener('DOMContentLoaded', () => {
    const adList = document.getElementById('adList');
    const saveButton = document.getElementById('saveButton');
    const exportButton = document.getElementById('exportButton');
    const importButton = document.getElementById('importButton');
    const importFile = document.getElementById('importFile');

    console.log(1,adList);
    console.log(2,saveButton);
    console.log(3,exportButton);
    console.log(4,importButton);
    console.log(5,importButton);
  
  
    // 加载保存的广告列表
    // chrome.storage.sync.get('customAdList', (data) => {
    //   const rawList = data.customAdList || [];
    //   adList.value = rawList.map(url => url.replace('||', '').replace('^', '')).join('\n');
    // });

    // 加载保存的广告列表
  chrome.storage.sync.get('customAdList', (data) => {
    const rawList = data.customAdList || [];
    adList.value = rawList.map(url => {
      if (url.startsWith('@@||') && url.endsWith('^')) {
        // 例外规则：移除||和^，保持原样
        return url;
      } else if (url.startsWith('/') && url.endsWith('/')) {
        // 正则规则：保持原样
        return url;
      } else if (url.startsWith('||') && url.endsWith('^')) {
        return url.replace('||', '').replace('^', '');
      }
      return url; // 未识别的格式保持原样
    }).join('\n');
  });

  
    // 保存广告列表
    saveButton.addEventListener('click', () => {


    //   const rawList = adList.value.split('\n').filter(line => line.trim() !== '');
    //   const formattedList = rawList.map(domain => `||${domain.trim()}^`);

    const rawList = adList.value.split('\n').filter(line => line.trim() !== '');
    const formattedList = rawList.map(domain => {
      if (domain.startsWith('@@')||domain.startsWith('||')||domain.startsWith('/')){
        return domain; // 保留用户输入的@@ 与
      } 
      return `||${domain.trim()}^`; // 普通规则添加||和^
    });


      chrome.storage.sync.set({ customAdList: formattedList }, () => {
        chrome.runtime.sendMessage({ action: 'updateRules', isEnabled: true });
        alert('Ad list saved!');
      });





    });
  
    // 导出为TXT文件
    exportButton.addEventListener('click', () => {
      const rawList = adList.value.split('\n').filter(line => line.trim() !== '');
      const textContent = rawList.join('\n');
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({
        url: url,
        filename: 'ad_block_list.txt',
        saveAs: true
      }, () => URL.revokeObjectURL(url));
    });


    
  
    // 触发导入文件选择
    importButton.addEventListener('click', () => {
      importFile.click();
    });
  
    // 处理导入文件
    // importFile.addEventListener('change', (event) => {
    //   const file = event.target.files[0];
    //   if (file) {
    //     const reader = new FileReader();
    //     reader.onload = (e) => {
    //       const importedText = e.target.result;
    //       adList.value = importedText;
    //       const rawList = importedText.split('\n').filter(line => line.trim() !== '');
    //       const formattedList = rawList.map(domain => `||${domain.trim()}^`);
    //       chrome.storage.sync.set({ customAdList: formattedList }, () => {
    //         chrome.runtime.sendMessage({ action: 'updateRules', isEnabled: true });
    //         alert('Ad list imported and saved!');
    //       });
    //     };
    //     reader.readAsText(file);
    //   }
    //   importFile.value = ''; // 清空input以允许重复导入同一文件
    // });
     // 处理导入文件
  importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const importedText = e.target.result;
        adList.value = importedText;
        const rawList = importedText.split('\n').filter(line => line.trim() !== '');
        const formattedList = rawList.map(domain => {
          if (domain.startsWith('@@')){
            return domain;
          } 
          if (domain.startsWith('/') && domain.endsWith('/')) return domain;

          return `||${domain.trim()}^`;
        });

        chrome.storage.sync.set({ customAdList: formattedList }, () => {
          chrome.runtime.sendMessage({ action: 'updateRules', isEnabled: true });
          alert('Ad list imported and saved!');
        });
      };
      reader.readAsText(file);
    }
    importFile.value = ''; // 清空input以允许重复导入同一文件
  });
  });