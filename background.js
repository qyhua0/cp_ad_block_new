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


// 默认拦截域名列表
const defaultAdList = [
  "||000dn.com^",
  "||kwcdn.000dn.com^",
  "||kwcscdn.000dn.com^",
  "||kwflvcdn.000dn.com^",
  "||0013.cc^",
  "||s8.001fzc.com^",
  "||yn.001fzc.com^",
  "||001union.com^",
  "||jump.001union.com^",
  "||jump.baidu.001union.com^",
  "||0024aadd.com^",
  "||002777.xyz^",
  "||003store.com^",
  "||cp.003store.com^",
  "||00404850.xyz^",
  "||00771944.xyz^",
  "||cdn.007moms.com^",
  "||my.007moms.com^",
  "||0082tv.net^",
  "||00857731.xyz^",
  "||www.0086555.com^",
  "||00f8c4bb25.com^",
  "||00oo00.com^",
  "||00px.net^",
  "||qjfcdn1220.0101122.com^",
  "||01045395.xyz^",
  "||010teacher.com^",
  "||011211.cn^",
  "||a8clk.011330.jp^",
  "||012024jhvjhkozekl.space^",
  "||01210sop.xyz^",
  "||01211sop.xyz^",
  "||01221sop.xyz^",
  "||01231sop.xyz^",
  "||0123kjz.com^",
  "||01240sop.xyz^",
  "||0127c96640.com^",
  "||a8.wizrecruitment.012grp.co.jp^",
  "||a8cv.012grp.co.jp^",
  "||a8cv.f.012grp.co.jp^",
  "||cc.0133hao.net^",
  "||013572.cn^",
  "||m.017cm2.cn^",
  "||018520.com^",
  "||019103.com^",
  "||a8.01cloud.jp^",
  "||01counter.com^",
  "||01jud3v55z.com^",
  "||01ws5t.cn^",
  "||0202.com.tw^",
  "||www.0202.com.tw^",
  "||02085170.xyz^",
  "||020wujin.cn^",
  "||weldc1.021ye.com^",
  "||cname-aa.022022.net^",
  "||photo.0234408.cn^",
  "||023e6510cc.com^",
  "||0265331.com^",
  "||img.0279.net^",
  "||o.027eat.com^",
  "||coach.028csc.com^",
  "||028yhtz.com^",
  "||m.030ha.cn^",
  "||m.031177.com^",
  "||03180d2d.live^",
  "||0322cfmtl.cc^",
  "||033.com^",
  "||033ajy.xyz^",
  "||0342b40dd6.com^",
  "||oscnjc.035000.com^",
  "||03505ed0f4.com^",
  "||0351dvd.cn^",
  "||jc.0351dvd.cn^",
  "||0377shujuhuifu.top^",
  "||03b5f525af.com^",
  "||a8cv.03plus.net^",
  "||04-f-bmf.com^",
  "||b1.0430.com^",
  "||b2.0430.com^",
  "||04424170.xyz^",
  "||044da016b3.com^",
  "||q.0451106.com^",
  "||04c8b396bf.com^",
  "||04e0d8fb0f.com^",
  "||04o.fun^",
  "||awklir.0506mall.com^",
  "||0511code.com^",
  "||0512pifa.com.cn^",
  "||0512s.com^",
  "||s.051352.com^",
  "||nxw.0518g.com^",
  "||api.0530hz.cn^",
  "||e.0531mnk.net^",
  "||m.0531mnk.net^",
  "||lkbf.0532ci.com.cn^",
  "||05420795.xyz^"
];


// 更新拦截规则
function updateRules(isEnabled, customAdList = []) {
  const rules = isEnabled ? [
    ...defaultRules,
    ...customAdList.map((url, index) => ({
      id: index + 2,
      priority: url.startsWith("@@") ? 2 : 1,
      action: { type: url.startsWith("@@") ? "allow" : "block" },
      condition: {
        urlFilter: url.startsWith("@@") ? url.slice(2) : url,
        resourceTypes: ["script", "image", "stylesheet", "main_frame", "sub_frame"]
      }
    }))
  ] : [];

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: defaultRules.length + customAdList.length }, (_, i) => i + 1),
    addRules: rules
  });
}

//插件安装时设置默认数据
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // 新安装时设置默认拦截列表和启用状态
    chrome.storage.sync.set({
      customAdList: defaultAdList,
      isEnabled: true
    }, () => {
      updateRules(true, defaultAdList);
    });


    // 默认搜索引擎设置
    chrome.storage.sync.get(["baiduEnabled", "googleEnabled", "bingEnabled"], (data) => {
      const defaults = {};
      if (data.baiduEnabled === undefined) defaults.baiduEnabled = true;
      if (data.googleEnabled === undefined) defaults.googleEnabled = true;
      if (data.bingEnabled === undefined) defaults.bingEnabled = true;
      if (Object.keys(defaults).length > 0) {
        chrome.storage.sync.set(defaults);
      }
    });


  } else if (details.reason === "update") {
    // 更新时保留用户数据，不覆盖
    chrome.storage.sync.get(["isEnabled", "customAdList"], (data) => {
      updateRules(data.isEnabled !== false, data.customAdList || defaultAdList);
    });
  }
});



// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateRules') {
    chrome.storage.sync.get('customAdList', (data) => {
      const customAdList = data.customAdList || [];
      updateRules(message.isEnabled, customAdList);
    });
  } else if (message.action === "updateSearchFilters") {
    // 更新搜索引擎过滤设置
    console.log("Search filters updated:", message.searchSettings);
    if (Object.keys(message.searchSettings).length > 0) {
      chrome.storage.sync.set(message.searchSettings);
    }
    sendResponse({ success: true });
  } else if(message.action === "updateOptions"){
    //let data={k:key,v:newCount,type:'from_engine'};
    //chrome.runtime.sendMessage({ action: "updateOptions", data });
    console.log("---background接收到的数据(updateOptions)：", message.data);

    // 发送消息给选项页
    chrome.runtime.sendMessage({ action: "updateUI", data: message.data }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("消息发送失败：", chrome.runtime.lastError.message);
      } else {
        console.log("接收到的响应：", response);
      }
    });
  }


  return true; // 指示异步响应

});


// 当扩展图标被点击时的操作
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});