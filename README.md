# Payment Gateway SDK

A simple and easy-to-use Node.js payment gateway SDK for quick integration of payment functionality.

## Features

- ✅ Create orders (supports multiple payment methods)
- ✅ Query orders (single/list)
- ✅ Check order status (public endpoint)
- ✅ Get exchange rate information (public endpoint)
- ✅ Automatic signature verification
- ✅ Comprehensive error handling
- ✅ TypeScript type support (planned)

## Supported Payment Methods

| Payment Method | Code | Supported Currencies | Description |
|---------------|------|---------------------|-------------|
| Alipay | `alipay` | CNY, USD | Alipay mobile payment |
| WeChat Pay | `wxpay` | CNY, USD | WeChat mobile payment |

## Installation

```bash
npm install payment-gateway-sdk
```

Or install from local directory:

```bash
npm install ./githup
```

## Quick Start

### 1. Initialize SDK

```javascript
const PaymentGateway = require('payment-gateway-sdk');

const gateway = new PaymentGateway({
  baseUrl: 'https://socialites.io',  // API base URL
  appId: 'your-app-id',                // Application ID
  apiKey: 'your-api-key',              // API key
  clientIp: '127.0.0.1'                 // Client IP (optional)
});
```

### 2. Create Order

```javascript
try {
  const order = await gateway.createOrder({
    amount: 100.00,
    currency: 'CNY',
    paymentMethod: 'alipay',
    description: 'Test order',
    customerName: 'John Doe',
    customerEmail: 'john@example.com'
  });

  console.log('Order created:', order.data.orderId);
  console.log('QR Code URL:', order.data.qrImageUrl);
  console.log('Payment Method:', order.data.orderPaymentMethod);
} catch (error) {
  console.error('Failed to create order:', error.message);
}
```

### 3. Query Order

```javascript
// Query single order
try {
  const result = await gateway.queryOrder({
    orderId: 'abc123def456...'
  });
  
  console.log('Order:', result.data);
  console.log('Status:', result.data.status_str);
} catch (error) {
  console.error('Failed to query order:', error.message);
}

// Query order list
try {
  const result = await gateway.queryOrder({
    limit: 20,
    page: 1
  });
  
  console.log('Orders:', result.data);
} catch (error) {
  console.error('Failed to query orders:', error.message);
}
```

### 4. Check Order Status (Public Endpoint)

```javascript
try {
  const status = await gateway.checkOrderStatus('abc123def456...');
  
  console.log('Status:', status.status);        // pending, ready, paid, failed, cancelled
  console.log('Status Code:', status.statusCode); // 0, 1, 2, 3, 4
} catch (error) {
  console.error('Failed to check status:', error.message);
}
```

### 5. Get Exchange Rate

```javascript
try {
  const rate = await gateway.getExchangeRate();
  console.log('USD to CNY:', rate.data.exchangeRate);
} catch (error) {
  console.error('Failed to get exchange rate:', error.message);
}
```

## API Documentation

### PaymentGateway

#### Constructor

```javascript
new PaymentGateway(config)
```

**Parameters:**

- `config.baseUrl` (string, required) - API base URL
- `config.appId` (string, required) - Application ID
- `config.apiKey` (string, required) - API key
- `config.clientIp` (string, optional) - Client IP address, defaults to environment variable `CLIENT_IP`
- `config.timeout` (number, optional) - Request timeout in milliseconds, default 30000

#### createOrder(options)

Create a payment order.

**Parameters:**

- `options.amount` (number, required) - Order amount
- `options.currency` (string, required) - Currency type: `CNY` or `USD`
- `options.paymentMethod` (string, required) - Payment method: `alipay` or `wxpay`
- `options.description` (string, optional) - Order description
- `options.clientOrderId` (string, optional) - Client order ID
- `options.customerName` (string, optional) - Customer name
- `options.customerEmail` (string, optional) - Customer email
- `options.customerPhone` (string, optional) - Customer phone

**Return Value:**

```javascript
{
  code: 1,
  message: "success",
  data: {
    orderId: "abc123def456...",
    qrImageUrl: "https://socialites.io/images/qrcodes/xxx.png",
    orderAmount: 100.00,
    orderCurrency: "CNY",
    orderPaymentMethod: "alipay",
    orderDescription: "Test order",
    status: 1,
    statusString: "ready",
    createdAt: "2025-01-01T00:00:00.000Z"
  }
}
```

#### queryOrder(options)

Query order information.

**Parameters:**

- `options.orderId` (string, optional) - Order ID (required when querying a single order)
- `options.limit` (number, optional) - Records per page (max 50, default 10)
- `options.page` (number, optional) - Page number (default 1)

**Return Value:**

Single order:
```javascript
{
  code: 1,
  message: "success",
  data: {
    orderId: "abc123...",
    amount: 100.00,
    currency: "CNY",
    status: 2,
    status_str: "paid",
    description: "Test order",
    paymentMethod: "alipay",
    createdAt: "2025-01-01T00:00:00.000Z",
    completedTime: "2025-01-01T00:05:00.000Z",
    updatedAt: "2025-01-01T00:05:00.000Z"
  }
}
```

Order list:
```javascript
{
  code: 1,
  message: "success",
  data: [
    {
      orderId: "abc123...",
      amount: 100.00,
      currency: "CNY",
      status: 2,
      status_str: "paid",
      ...
    },
    ...
  ]
}
```

#### checkOrderStatus(orderId)

Check order status (public endpoint, no authentication required).

**Parameters:**

- `orderId` (string, required) - Order ID

**Return Value:**

```javascript
{
  status: "paid",        // pending, ready, paid, failed, cancelled
  statusCode: 2,          // 0, 1, 2, 3, 4
  orderId: "abc123..."
}
```

#### getExchangeRate()

Get current USD to CNY exchange rate (public endpoint, no authentication required).

**Return Value:**

```javascript
{
  code: 1,
  message: "success",
  data: {
    exchangeRate: 7.2
  }
}
```

## Order Status

| Status Code | Status String | Description |
|------------|--------------|-------------|
| 0 | `pending` | Order created, waiting for processing |
| 1 | `ready` | Order sent to payment provider, QR code generated |
| 2 | `paid` | Payment successful |
| 3 | `failed` | Payment failed |
| 4 | `cancelled` | Order cancelled |

## Error Handling

The SDK throws errors, it's recommended to use try-catch to handle them:

```javascript
try {
  const order = await gateway.createOrder({...});
} catch (error) {
  console.error('Error:', error.message);
  // Handle error
}
```

Common errors:

- `amount must be a positive number` - Amount must be a positive number
- `currency must be CNY or USD` - Invalid currency type
- `paymentMethod is required` - Payment method is required
- `paymentMethod must be alipay or wxpay` - Payment method must be alipay or wxpay
- `Create order failed` - Failed to create order (may be signature error, parameter error, etc.)
- `Network error: No response from server` - Network error

## Signature Mechanism

The SDK automatically handles signatures, no manual calculation needed. Signature algorithm:

1. Filter out `sign` and `sign_type` fields
2. Filter out `null` and `undefined` values
3. Sort by key name
4. Concatenate into string: `key1=value1&key2=value2`
5. Append API Key: `key1=value1&key2=value2&apikey`
6. MD5 encrypt and convert to lowercase

## Complete Examples

See example files in the `examples/` directory:

- `basic-usage.js` - Basic usage example (Alipay)
- `wechat-payment.js` - WeChat Pay example
- `order-polling.js` - Order polling example

## License

MIT

## Support

For questions or suggestions, please contact technical support.
