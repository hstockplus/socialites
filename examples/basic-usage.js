/**
 * Payment Gateway SDK - Basic Usage Example
 * 
 * Run: node examples/basic-usage.js
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
  console.log('=== Payment Gateway SDK Example ===\n');

  try {
    // 1. Create order (Alipay)
    console.log('1. Creating order (Alipay)...');
    const order = await gateway.createOrder({
      amount: 100.00,
      currency: 'CNY',
      paymentMethod: 'alipay',
      description: 'Test order',
      customerName: 'John Doe',
      customerEmail: 'john@example.com'
    });

    console.log('✅ Order created successfully!');
    console.log('Order ID:', order.data.orderId);
    console.log('QR Code URL:', order.data.qrImageUrl);
    console.log('Order Amount:', order.data.orderAmount, order.data.orderCurrency);
    console.log('Payment Method:', order.data.orderPaymentMethod);
    console.log('Order Status:', order.data.statusString);
    console.log('');

    const orderId = order.data.orderId;

    // 2. Query order
    console.log('2. Querying order...');
    const orderInfo = await gateway.queryOrder({ orderId });
    console.log('✅ Order queried successfully!');
    console.log('Order Info:', JSON.stringify(orderInfo.data, null, 2));
    console.log('');

    // 3. Check order status (public endpoint)
    console.log('3. Checking order status...');
    const status = await gateway.checkOrderStatus(orderId);
    console.log('✅ Status queried successfully!');
    console.log('Status:', status.status);
    console.log('Status Code:', status.statusCode);
    console.log('');

    // 4. Get exchange rate
    console.log('4. Getting exchange rate...');
    const rate = await gateway.getExchangeRate();
    console.log('✅ Exchange rate queried successfully!');
    console.log('USD to CNY:', rate.data.exchangeRate);
    console.log('');

    // 5. Query order list
    console.log('5. Querying order list...');
    const orders = await gateway.queryOrder({ limit: 10, page: 1 });
    console.log('✅ Order list queried successfully!');
    console.log('Order Count:', orders.data.length);
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
