document.addEventListener("DOMContentLoaded", () => {
    // 1. Button Click Handlers
    const buttons = document.querySelectorAll("button");
    
    buttons.forEach(button => {
        button.addEventListener("click", (e) => {
            const action = e.target.innerText.trim();
            if (action.includes("Book Appointment")) {
                alert("Opening appointment calendar for Dr. A. Sharma...");
            } else if (action.includes("Order Medicines")) {
                alert("Checking inventory at Village Care Pharmacy...");
            }
        });
    });

    // 2. Rural Network Connectivity Monitor
    function checkNetwork() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            const type = connection.effectiveType.toUpperCase();
            console.log(`Network Status: ${type} connection detected.`);
            
            // Optional: Alert user if connection is too slow for heavy loading
            if (type === '2G' || type === 'SLOW-2G') {
                console.warn("Low bandwidth detected. Enabling offline mode.");
            }
        }
    }

    checkNetwork();
    
    if (navigator.connection) {
        navigator.connection.addEventListener("change", checkNetwork);
    }
});