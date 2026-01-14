/**
 * Payment Gateway SDK - WeChat Pay Example
 * 
 * Run: node examples/wechat-payment.js
 */

const PaymentGateway = require('../index');

// Initialize SDK
const gateway = new PaymentGateway({
  baseUrl: 'https://socialites.io',  // Replace with your API base URL
  appId: 'your-app-id',               // Replace with your application ID
  apiKey: 'your-api-key',             // Replace with your API key
  clientIp: '127.0.0.1'
});

async function main() {
  console.log('=== WeChat Pay Example ===\n');

  try {
    // 1. Create WeChat Pay order (CNY)
    console.log('1. Creating WeChat Pay order (CNY)...');
    const orderCNY = await gateway.createOrder({
      amount: 100.00,
      currency: 'CNY',
      paymentMethod: 'wxpay',
      description: 'WeChat Pay test order',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '13800000000'  // Example phone number
    });

    console.log('✅ CNY order created successfully!');
    console.log('Order ID:', orderCNY.data.orderId);
    console.log('QR Code URL:', orderCNY.data.qrImageUrl);
    console.log('Order Amount:', orderCNY.data.orderAmount, orderCNY.data.orderCurrency);
    console.log('Payment Method:', orderCNY.data.orderPaymentMethod);
    console.log('');

    // 2. Create WeChat Pay order (USD)
    console.log('2. Creating WeChat Pay order (USD)...');
    const orderUSD = await gateway.createOrder({
      amount: 50.00,
      currency: 'USD',
      paymentMethod: 'wxpay',
      description: 'WeChat Pay USD Order',
      customerName: 'John Doe',
      customerEmail: 'john@example.com'
    });

    console.log('✅ USD order created successfully!');
    console.log('Order ID:', orderUSD.data.orderId);
    console.log('QR Code URL:', orderUSD.data.qrImageUrl);
    console.log('Order Amount:', orderUSD.data.orderAmount, orderUSD.data.orderCurrency);
    console.log('');

    // 3. Check order status
    console.log('3. Checking order status...');
    const status = await gateway.checkOrderStatus(orderCNY.data.orderId);
    console.log('Order Status:', status.status);
    console.log('Status Code:', status.statusCode);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run example
main();
