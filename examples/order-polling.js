/**
 * Payment Gateway SDK - Order Polling Example
 * 
 * This example demonstrates how to poll order status until payment is completed or timeout
 * 
 * Run: node examples/order-polling.js
 */

const PaymentGateway = require('../index');

// Initialize SDK
const gateway = new PaymentGateway({
  baseUrl: 'https://socialites.io',  // Replace with your API base URL
  appId: 'your-app-id',               // Replace with your application ID
  apiKey: 'your-api-key',             // Replace with your API key
  clientIp: '127.0.0.1'
});

/**
 * Poll order status
 * 
 * @param {string} orderId - Order ID
 * @param {Object} options - Polling options
 * @param {number} options.interval - Check interval in milliseconds, default 5000
 * @param {number} options.maxAttempts - Maximum check attempts, default 60
 * @param {Function} options.onStatusChange - Status change callback function
 * @returns {Promise<Object>} Final order status
 */
async function pollOrderStatus(orderId, options = {}) {
  const {
    interval = 5000,      // Default check every 5 seconds
    maxAttempts = 60,     // Default maximum 60 attempts (5 minutes)
    onStatusChange = null // Status change callback
  } = options;

  let attempts = 0;
  let lastStatus = null;

  while (attempts < maxAttempts) {
    try {
      const status = await gateway.checkOrderStatus(orderId);
      
      // If status changed, call callback function
      if (onStatusChange && status.status !== lastStatus) {
        onStatusChange(status, attempts);
      }

      lastStatus = status.status;

      // If order is completed (paid, failed or cancelled), return result
      if (['paid', 'failed', 'cancelled'].includes(status.status)) {
        return {
          success: status.status === 'paid',
          status: status,
          attempts: attempts + 1
        };
      }

      attempts++;
      
      // If not reached max attempts, wait and continue
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error(`Failed to check order status (attempt ${attempts + 1}/${maxAttempts}):`, error.message);
      attempts++;
      
      // If network error, wait and retry
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  // Timeout
  return {
    success: false,
    status: { status: 'timeout', statusCode: -1, orderId },
    attempts: maxAttempts,
    timeout: true
  };
}

async function main() {
  console.log('=== Order Polling Example ===\n');

  try {
    // 1. Create order
    console.log('1. Creating order...');
    const order = await gateway.createOrder({
      amount: 100.00,
      currency: 'CNY',
      paymentMethod: 'alipay',
      description: 'Polling test order'
    });

    console.log('✅ Order created successfully!');
    console.log('Order ID:', order.data.orderId);
    console.log('QR Code URL:', order.data.qrImageUrl);
    console.log('');

    const orderId = order.data.orderId;

    // 2. Start polling
    console.log('2. Starting to poll order status...');
    console.log('Tip: Please scan the QR code with your phone to complete payment\n');

    const result = await pollOrderStatus(orderId, {
      interval: 5000,  // Check every 5 seconds
      maxAttempts: 60,   // Maximum 60 attempts (5 minutes)
      onStatusChange: (status, attempts) => {
        console.log(`[${new Date().toLocaleTimeString()}] Status changed: ${status.status} (attempt: ${attempts + 1})`);
      }
    });

    // 3. Display result
    console.log('\n=== Polling Result ===');
    if (result.success) {
      console.log('✅ Order paid successfully!');
      console.log('Final Status:', result.status.status);
      console.log('Attempts:', result.attempts);
    } else if (result.timeout) {
      console.log('⏱️ Polling timeout');
      console.log('Attempts:', result.attempts);
      console.log('Tip: Order may still be processing, please query manually later');
    } else {
      console.log('❌ Order payment not successful');
      console.log('Final Status:', result.status.status);
      console.log('Attempts:', result.attempts);
    }

    // 4. Query final order information
    console.log('\n3. Querying final order information...');
    const finalOrder = await gateway.queryOrder({ orderId });
    console.log('Order Details:', JSON.stringify(finalOrder.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run example
main();
