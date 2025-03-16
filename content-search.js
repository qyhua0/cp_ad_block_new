// 初始化函数
function initSearchAdFiltering() {
  // 检查扩展是否启用
  chrome.storage.sync.get("isEnabled", function (data) {
    const isEnabled = data.isEnabled !== false;

    //console.log("---initSearchAdFiltering -> "+isEnabled);
    if (!isEnabled) {
      return; // 如果扩展被禁用，则退出
    }

    // 检测当前所在的搜索引擎
    const currentURL = window.location.href;

    if (currentURL.includes('baidu.com/s')) {
      chrome.storage.sync.get('baiduEnabled', function (data) {
        const baiduEnabled = data.baiduEnabled !== undefined ? data.baiduEnabled : true;
        if (baiduEnabled) {
          filterBaiduAds();
            // 设置观察器以处理动态内容
          setupMutationObserver(filterBaiduAds);
      
        }
      });
    } else if (currentURL.includes('google.com/search')) {
      chrome.storage.sync.get('googleEnabled', function (data) {
        const googleEnabled = data.googleEnabled !== undefined ? data.googleEnabled : true;
        if (googleEnabled) {
          filterGoogleAds();
          setupMutationObserver(filterGoogleAds);
        }
      });
    } else if (currentURL.includes('bing.com/search')) {
      chrome.storage.sync.get('bingEnabled', function (data) {
        const bingEnabled = data.bingEnabled !== undefined ? data.bingEnabled : true;
        if (bingEnabled) {
          filterBingAds();
          setupMutationObserver(filterBingAds);
        }
      });
    }
  });
}




// 过滤百度搜索结果
function filterBaiduAds() {
  let hiddenCount=0;

  //console.log('========filterBaiduAds')

  const baiduAdSelectors = [
    'div[cmatchid]',
    '.ec_tuiguang_container',
    '.ec_tuiguang_ppimlink',
    '.EC_PP',
    '.ec_pp_f',
    '.ad-icon',
    '[tpl="adv_wenku_fc"]',
    '[tpl="adv_wenku"]',
    '[data-sf-provider]',
    '[data-tpl="adv_relative"]'
  ];

  baiduAdSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          const adContainer = el.closest('.result, .c-container, .result-op') || el;
          adContainer.style.display = 'none';
          hiddenCount++;
          return;
        });
      }
    } catch (e) {
      console.warn('Error with selector:', selector, e);
    }
  });


  
  const containers = document.querySelectorAll('div.c-container,div.cr-content');

 // console.log('---选中.c-container = '+containers.length);


  containers.forEach(container => {

    // 如果该容器已隐藏，则跳过处理
    if (container.style.display === 'none') {
      return;
    }

    // 获取 container 中所有 span 元素
    const spans = container.getElementsByTagName('span');
    for (let span of spans) {
      const text = span.textContent;
      if (/(广告|ad)/i.test(text)) {
        container.style.display = 'none';
        hiddenCount++;
        //console.log('匹配的 container:', i, container);
        return; 
      }
    }
  });



  // 应用自定义关键词过滤
  applyCustomFilters();

   // 更新统计信息
   updateHiddenCount('baidu', hiddenCount);

}

// 过滤Google搜索结果
function filterGoogleAds() {
  let hiddenCount=0;
  // 常见的Google广告选择器
  const googleAdSelectors = [
    // 商业推广结果
    '.commercial-unit',
    '.ads-ad',
    '.ad-container',
    '.ads-fr',
    '.adsbygoogle',
    'div[data-text-ad]',
    '[data-ad-slot]',
    '[data-ad-client]'
  ];

  // 移除广告元素
  googleAdSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {

        const adBlock = el.closest('.g, .ads-fr, .ads-tn, .adBlock, li.ads-fr');

        if (adBlock) {
          if (adBlock.style.display === 'none') return;
          adBlock.style.display = 'none';
          hiddenCount++;
        } else {
          hiddenCount++;
          el.style.display = 'none';
        }
      });
    } catch (e) {
      console.warn('Error with selector:', selector, e);
    }
  });

  // 文本查找方法
  document.querySelectorAll('.g, li').forEach(container => {

    if (container.style.display === 'none') return;


    if (container.textContent.includes('广告') ||
      container.textContent.includes('Sponsored') ||
      container.textContent.includes('Ad ·')) {
      container.style.display = 'none';
      hiddenCount++;
    }
  });

  // 应用自定义关键词过滤
  applyCustomFilters();
// 更新统计信息
updateHiddenCount('google', hiddenCount);

 
}

// 过滤Bing搜索结果
function filterBingAds() {
  let hiddenCount=0;
  // 常见的Bing广告选择器
  const bingAdSelectors = [
    // 商业推广结果
    '.b_ad',
    '.b_adLastChild',
    '.ad_sc',
    '.ads-fr',
    '.b_adlabel',
    '.adCard'
  ];

  // 移除广告元素
  bingAdSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const adBlock = el.closest('.b_algo, .b_ad, li.b_ad');
        if (adBlock) {
          adBlock.style.display = 'none';
          hiddenCount++;
        } else {
          el.style.display = 'none';
          hiddenCount++;
        }
      });
    } catch (e) {
      console.warn('Error with selector:', selector, e);
    }
  });

  // 文本查找方法
  document.querySelectorAll('li').forEach(container => {
    if (container.style.display == 'none'){
          return;
    }
    if (container.textContent.includes('广告') ||
      container.textContent.includes('Ad') ||
      container.textContent.includes('Sponsored')) {
      container.style.display = 'none';
      hiddenCount++;
    }
  });

  // 应用自定义关键词过滤
  applyCustomFilters();
// 更新统计信息
updateHiddenCount('bing', hiddenCount);


}

// 应用自定义广告关键词过滤
function applyCustomFilters() {
  chrome.storage.sync.get(['customFiltersEnabled', 'customAdWords'], function (data) {
    const customFiltersEnabled = data.customFiltersEnabled !== undefined ?
      data.customFiltersEnabled : false;

    if (!customFiltersEnabled || !data.customAdWords) {
      return;
    }

    const keywords = data.customAdWords.split('\n')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);

    if (keywords.length === 0) {
      return;
    }

    // 获取所有搜索结果元素
    let resultElements = [];

    // 检测当前所在的搜索引擎
    const currentURL = window.location.href;

    if (currentURL.includes('baidu.com/s')) {
      resultElements = Array.from(document.querySelectorAll('.result, .c-container, .result-op'));
    } else if (currentURL.includes('google.com/search')) {
      resultElements = Array.from(document.querySelectorAll('.g, li'));
    } else if (currentURL.includes('bing.com/search')) {
      resultElements = Array.from(document.querySelectorAll('.b_algo, li'));
    }

    // 过滤包含广告关键词的结果
    resultElements.forEach(element => {
      const text = element.textContent.toLowerCase();

      for (const keyword of keywords) {
        if (keyword && text.includes(keyword.toLowerCase())) {
          element.style.display = 'none';
          break;
        }
      }
    });
  });
}


// 通用统计更新函数：更新指定搜索引擎的拦截计数
function updateHiddenCount(engine, countIncrement) {
  if(countIncrement>0){
    const key = 'ad_hidden_count_'+engine; 
    chrome.storage.sync.get(key, (data) => {
      const prevCount = data[key] || 0;
      const newCount = prevCount + countIncrement;
      chrome.storage.sync.set({ [key]: newCount }, () => {
       // console.log(`${engine} 已拦截广告次数更新为: `, newCount);
        let data={k:key,v:newCount,type:'from_engine'};
        chrome.runtime.sendMessage({ action: "updateOptions", data });
      });
    });
  }
}

// 设置变异观察器以处理动态加载的内容
function setupMutationObserver(filterFunction) {
  // 创建一个观察器实例
  const observer = new MutationObserver(function (mutations) {
    // 不需要处理所有变异，只需再次运行过滤器
    filterFunction();
  });

  // 观察器配置
  const config = {
    childList: true,
    subtree: true
  };

  // 开始观察
  observer.observe(document.body, config);

  // 3分钟后停止，以防止性能问题
  setTimeout(function () {
    observer.disconnect();
  }, 180000);
}


window.addEventListener('load', initSearchAdFiltering);
window.addEventListener('popstate', initSearchAdFiltering);