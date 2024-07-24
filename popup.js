document.addEventListener('DOMContentLoaded', function() {
    const monthSelect = document.getElementById('monthSelect');
    const yearInput = document.getElementById('yearInput');
    const fetchButton = document.getElementById('fetchButton');

    // Populate month dropdown
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1; // Month value should be 1-12
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    // Set current month and year as default
    const currentDate = new Date();
    monthSelect.value = currentDate.getMonth() + 1; // getMonth() returns 0-11
    yearInput.value = currentDate.getFullYear();

    fetchButton.addEventListener('click', () => {
        const selectedMonth = monthSelect.value.padStart(2, '0'); // Ensure two digits
        const selectedYear = yearInput.value;
        const formattedDate = `${selectedYear}-${selectedMonth}-01`;
        
        console.log('Date selected:', formattedDate);

        chrome.cookies.get({ url: 'https://partner.urbansportsclub.com', name: 'PHPSESSID' }, (cookie) => {
            if (cookie) {
                const sessionId = cookie.value;
                console.log('PHPSESSID cookie found:', sessionId);
                
                // Send message to background script to fetch data
                chrome.runtime.sendMessage({ action: 'fetchData', date: formattedDate, sessionId: sessionId });
                
                // Show alert that download is starting
                alert('CSV file is being downloaded. Please check your downloads folder.');
            } else {
                console.error('No PHPSESSID cookie found!');
                alert('Error: No session cookie found. Please log in to the website first.');
            }
        });
    });
});