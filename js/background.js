// listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(function(id, info, tab) {
  console.log(tab);
  if (tab.url.toLowerCase().indexOf("youtube.com") > -1) {
    chrome.pageAction.show(tab.id);
  }
});