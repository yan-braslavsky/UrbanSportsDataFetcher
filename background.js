chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);
  
    if (message.action === 'fetchData') {
      const { date, sessionId } = message;
      const url = `https://partner.urbansportsclub.com/de/checkin/data?date=${date}&venueAddressId=17752&monthly=true&status=`;
      console.log('Fetching data from URL:', url);
  
      fetch(url, {
        method: 'GET',
        headers: {
          'Cookie': `PHPSESSID=${sessionId}`
        }
      })
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Data fetched successfully:', data);
  
        // Convert JSON to CSV
        const csvContent = jsonToCSV(data.data.data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = `data-${date}.csv`;
        
        const reader = new FileReader();
        reader.onload = function(event) {
          const base64Data = event.target.result.split(',')[1];
          const url = `data:text/csv;base64,${base64Data}`;
          
          chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
          }, downloadId => {
            console.log('Download initiated with ID:', downloadId);
          });
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => console.error('Error fetching data:', error));
    }
  });
  
  function jsonToCSV(jsonData) {
    if (jsonData.length === 0) {
      return '';
    }
  
    const headers = Object.keys(jsonData[0]);
    const csvRows = [];
  
    // Add header row
    csvRows.push(headers.join(','));
  
    // Add data rows
    for (const row of jsonData) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
  
    return csvRows.join('\n');
  }