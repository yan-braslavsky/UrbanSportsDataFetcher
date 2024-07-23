document.getElementById('fetchButton').addEventListener('click', () => {
    const date = document.getElementById('dateInput').value;
    console.log('Date selected:', date);
  
    chrome.cookies.get({ url: 'https://partner.urbansportsclub.com', name: 'PHPSESSID' }, (cookie) => {
      if (cookie) {
        const sessionId = cookie.value;
        console.log('PHPSESSID cookie found:', sessionId);
        
        // Send message to background script to fetch data
        chrome.runtime.sendMessage({ action: 'fetchData', date: date, sessionId: sessionId });
      } else {
        console.error('No PHPSESSID cookie found!');
      }
    });
  });
  