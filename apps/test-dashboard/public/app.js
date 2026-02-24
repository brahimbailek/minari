// Global state
let authToken = null;
let successCount = 0;
let failCount = 0;

// Update stats
function updateStats() {
    document.getElementById('successCount').textContent = successCount;
    document.getElementById('failCount').textContent = failCount;
}

// Show response
function showResponse(data, success = true) {
    const viewer = document.getElementById('responseViewer');
    const content = document.getElementById('responseContent');

    content.textContent = JSON.stringify(data, null, 2);
    viewer.classList.add('active');

    if (success) {
        successCount++;
    } else {
        failCount++;
    }
    updateStats();
}

// Close response viewer
function closeResponse() {
    document.getElementById('responseViewer').classList.remove('active');
}

// Update auth section
function updateAuthSection(token) {
    authToken = token;
    const section = document.getElementById('authSection');
    const tokenDisplay = document.getElementById('authToken');

    if (token) {
        section.style.display = 'block';
        tokenDisplay.textContent = `Bearer ${token.substring(0, 50)}...`;
    } else {
        section.style.display = 'none';
    }
}

// Get service URL
function getServiceUrl(service) {
    // Check if custom URL is set, otherwise use production URLs
    const customUrls = {
        'auth': document.getElementById('authUrl').value,
        'numbers': document.getElementById('numbersUrl').value,
        'messaging': document.getElementById('messagingUrl').value,
        'billing': document.getElementById('billingUrl').value,
        'call': document.getElementById('callUrl').value
    };

    // Default production URLs (Railway)
    const productionUrls = {
        'auth': 'https://auth-production.up.railway.app',
        'numbers': 'https://numbers-production.up.railway.app',
        'messaging': 'https://messaging-production.up.railway.app',
        'billing': 'https://billing-production.up.railway.app',
        'call': 'https://call-production.up.railway.app'
    };

    return customUrls[service] || productionUrls[service] || 'http://localhost:3001';
}

// Test endpoints
async function testEndpoint(service, endpoint) {
    try {
        const baseUrl = getServiceUrl(service);
        let url, method, body, headers = {};

        // Add auth token if available
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Define test cases
        switch(`${service}-${endpoint}`) {
            // Auth Service
            case 'auth-register':
                url = `${baseUrl}/api/auth/register`;
                method = 'POST';
                body = {
                    email: `test${Date.now()}@commpro.com`,
                    password: 'Test123!@#',
                    firstName: 'Test',
                    lastName: 'User'
                };
                break;

            case 'auth-login':
                url = `${baseUrl}/api/auth/login`;
                method = 'POST';
                body = {
                    email: 'test@commpro.com',
                    password: 'Test123!@#'
                };
                break;

            case 'auth-2fa-enable':
                url = `${baseUrl}/api/auth/2fa/enable`;
                method = 'POST';
                break;

            case 'auth-me':
                url = `${baseUrl}/api/auth/me`;
                method = 'GET';
                break;

            // Numbers Service
            case 'numbers-search':
                url = `${baseUrl}/api/numbers/available?country=FR&limit=5`;
                method = 'GET';
                break;

            case 'numbers-purchase':
                url = `${baseUrl}/api/numbers/purchase`;
                method = 'POST';
                body = {
                    phoneNumber: '+33123456789',
                    friendlyName: 'Test Number'
                };
                break;

            case 'numbers-list':
                url = `${baseUrl}/api/numbers`;
                method = 'GET';
                break;

            // Messaging Service
            case 'messaging-send-sms':
                url = `${baseUrl}/api/messages/sms`;
                method = 'POST';
                body = {
                    from: '+33123456789',
                    to: '+33987654321',
                    body: 'Test message from dashboard'
                };
                break;

            case 'messaging-conversations':
                url = `${baseUrl}/api/messages/conversations`;
                method = 'GET';
                break;

            case 'messaging-contacts':
                url = `${baseUrl}/api/contacts`;
                method = 'GET';
                break;

            // Call Service
            case 'call-initiate':
                url = `${baseUrl}/api/calls/initiate`;
                method = 'POST';
                body = {
                    from: '+33123456789',
                    to: '+33987654321'
                };
                break;

            case 'call-list':
                url = `${baseUrl}/api/calls`;
                method = 'GET';
                break;

            case 'call-stats':
                url = `${baseUrl}/api/calls/stats`;
                method = 'GET';
                break;

            // Billing Service
            case 'billing-subscribe':
                url = `${baseUrl}/api/billing/subscribe`;
                method = 'POST';
                body = {
                    tier: 'STARTER'
                };
                break;

            case 'billing-subscription':
                url = `${baseUrl}/api/billing/subscription`;
                method = 'GET';
                break;

            case 'billing-usage':
                url = `${baseUrl}/api/billing/usage`;
                method = 'GET';
                break;

            case 'billing-invoices':
                url = `${baseUrl}/api/billing/invoices`;
                method = 'GET';
                break;

            // Status
            case 'status-health':
                await testAllServices();
                return;

            default:
                showResponse({ error: 'Endpoint not configured' }, false);
                return;
        }

        // Make request
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        // If login successful, save token
        if (service === 'auth' && endpoint === 'login' && data.accessToken) {
            updateAuthSection(data.accessToken);
        }

        showResponse({
            status: response.status,
            statusText: response.statusText,
            data
        }, response.ok);

        // Update service status
        updateServiceStatus(service, true);

    } catch (error) {
        showResponse({
            error: error.message,
            stack: error.stack
        }, false);

        updateServiceStatus(service, false);
    }
}

// Test all services health
async function testAllServices() {
    const services = ['auth', 'numbers', 'messaging', 'billing', 'call'];
    const results = {};

    for (const service of services) {
        try {
            const baseUrl = getServiceUrl(service);
            const response = await fetch(`${baseUrl}/status`);
            const data = await response.json();
            results[service] = {
                status: 'online',
                data
            };
            updateServiceStatus(service, true);
        } catch (error) {
            results[service] = {
                status: 'offline',
                error: error.message
            };
            updateServiceStatus(service, false);
        }
    }

    showResponse({
        timestamp: new Date().toISOString(),
        services: results
    }, true);
}

// Update service status indicator
function updateServiceStatus(service, online) {
    const statusEl = document.getElementById(`${service}-status`);
    if (statusEl) {
        statusEl.textContent = online ? '● En ligne' : '● Hors ligne';
        statusEl.classList.toggle('offline', !online);
    }
}

// Check all services on load
window.addEventListener('load', async () => {
    console.log('🎨 CommPro Test Dashboard loaded');

    // Test all services health
    const services = ['auth', 'numbers', 'messaging', 'billing', 'call'];
    for (const service of services) {
        try {
            const baseUrl = getServiceUrl(service);
            const response = await fetch(`${baseUrl}/status`);
            updateServiceStatus(service, response.ok);
        } catch (error) {
            updateServiceStatus(service, false);
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close response viewer
    if (e.key === 'Escape') {
        closeResponse();
    }
});
