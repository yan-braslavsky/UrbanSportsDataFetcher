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
          // Notify the popup that download has started
          chrome.runtime.sendMessage({ action: 'downloadStarted' });
        });
      };
      reader.readAsDataURL(blob);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      // Notify the popup about the error
      chrome.runtime.sendMessage({ action: 'fetchError', error: error.message });
    });
  }
});

function jsonToCSV(jsonData) {
  if (jsonData.length === 0) {
    return '';
  }

  const headerMapping = {
    'service_type_id': 'Type of activity',
    'check_in_system': 'check-in type',
    'state': 'status'
  };

  const headers = Object.keys(jsonData[0]).map(header => headerMapping[header] || header);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Mapping functions
  const mapMembershipPlanType = (id) => {
    const mapping = { 1: 'S', 2: 'M', 3: 'L', 4: 'XL' };
    return mapping[id] || id;
  };

  const mapServiceType = (id) => {
    return id === 0 ? 'Course' : `UNKNOWN_VALUE_[${id}]`;
  };

  const mapCheckInSystem = (id) => {
    return id === 2 ? 'App' : `UNKNOWN_VALUE_[${id}]`;
  };

  const mapState = (state) => {
    return state === 'done' ? 'check-in' : `UNKNOWN_VALUE_[${state}]`;
  };

  // Add data rows
  for (const row of jsonData) {
    const values = Object.keys(row).map(key => {
      let value = row[key];
      
      // Apply mappings
      if (key === 'membership_plan_type_id') {
        value = mapMembershipPlanType(value);
      } else if (key === 'service_type_id') {
        value = mapServiceType(value);
      } else if (key === 'check_in_system') {
        value = mapCheckInSystem(value);
      } else if (key === 'state') {
        value = mapState(value);
      }
      
      const escaped = ('' + value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}