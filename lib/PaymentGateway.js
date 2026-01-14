const axios = require('axios');
const crypto = require('crypto');

/**
 * Payment Gateway SDK
 * 
 * Provides a simple API interface for easy integration of payment gateway functionality
 * 
 * @example
 * const PaymentGateway = require('payment-gateway-sdk');
 * 
 * const gateway = new PaymentGateway({
 *   baseUrl: 'https://socialites.io',
 *   appId: 'your-app-id',
 *   apiKey: 'your-api-key',
 *   clientIp: '127.0.0.1' // Optional, defaults to environment variable
 * });
 * 
 * // Create order
 * const order = await gateway.createOrder({
 *   amount: 100.00,
 *   currency: 'CNY',
 *   paymentMethod: 'alipay',
 *   description: 'Test order'
 * });
 */
class PaymentGateway {
  /**
   * Create PaymentGateway instance
   * 
   * @param {Object} config - Configuration object
   * @param {string} config.baseUrl - API base URL (e.g., https://socialites.io)
   * @param {string} config.appId - Application ID
   * @param {string} config.apiKey - API key (for signature)
   * @param {string} [config.clientIp] - Client IP address (optional, defaults to environment variable)
   * @param {number} [config.timeout] - Request timeout in milliseconds (default 30000)
   */
  constructor(config) {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required');
    }
    if (!config.appId) {
      throw new Error('appId is required');
    }
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }

    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.appId = config.appId;
    this.apiKey = config.apiKey;
    this.clientIp = config.clientIp || process.env.CLIENT_IP || '127.0.0.1';
    this.timeout = config.timeout || 30000;

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate MD5 signature
   * 
   * @param {Object} params - Parameters object to sign
   * @returns {string} MD5 signature string (lowercase)
   * @private
   */
  _generateSign(params) {
    // Filter out sign and sign_type fields
    const filtered = {};
    for (const key in params) {
      if (key === 'sign' || key === 'sign_type') continue;
      if (params[key] === null || params[key] === undefined) continue;
      filtered[key] = params[key];
    }

    // Sort by key name
    const sortedKeys = Object.keys(filtered).sort();

    // Concatenate string
    const pairs = sortedKeys.map(key => {
      const value = filtered[key];
      if (typeof value === 'object') {
        // Convert object type to string format
        return `${key}=${JSON.stringify(value)}`;
      }
      return `${key}=${value}`;
    });

    const str = pairs.join('&');
    
    // MD5 encrypt and convert to lowercase
    const sign = crypto.createHash('md5').update(str + this.apiKey).digest('hex').toLowerCase();
    
    return sign;
  }

  /**
   * Create order
   * 
   * @param {Object} options - Order parameters
   * @param {number} options.amount - Order amount
   * @param {string} options.currency - Currency type (CNY or USD)
   * @param {string} options.paymentMethod - Payment method (alipay, wxpay)
   * @param {string} [options.description] - Order description
   * @param {string} [options.clientOrderId] - Client order ID (optional, auto-generated if not provided)
   * @param {string} [options.customerName] - Customer name
   * @param {string} [options.customerEmail] - Customer email
   * @param {string} [options.customerPhone] - Customer phone
   * @returns {Promise<Object>} Order information
   * 
   * @example
   * const order = await gateway.createOrder({
   *   amount: 100.00,
   *   currency: 'CNY',
   *   paymentMethod: 'alipay',
   *   description: 'Test order'
   * });
   * console.log('Order ID:', order.data.orderId);
   * console.log('QR Code URL:', order.data.qrImageUrl);
   */
  async createOrder(options) {
    const {
      amount,
      currency,
      paymentMethod,
      description = '',
      clientOrderId = null,
      customerName = '',
      customerEmail = '',
      customerPhone = ''
    } = options;

    // Parameter validation
    if (!amount || amount <= 0) {
      throw new Error('amount must be a positive number');
    }
    if (!currency || !['CNY', 'USD'].includes(currency)) {
      throw new Error('currency must be CNY or USD');
    }
    if (!paymentMethod) {
      throw new Error('paymentMethod is required');
    }
    if (!['alipay', 'wxpay'].includes(paymentMethod)) {
      throw new Error('paymentMethod must be alipay or wxpay');
    }

    // Build request parameters
    const params = {
      appid: this.appId,
      clientip: this.clientIp,
      action: 'createorder',
      amount: amount,
      currency: currency,
      paymentMethod: paymentMethod,
      description: description,
      sign_type: 'MD5'
    };

    // Add optional parameters
    if (clientOrderId) {
      params.clientOrderId = clientOrderId;
    }
    if (customerName) {
      params.customerName = customerName;
    }
    if (customerEmail) {
      params.customerEmail = customerEmail;
    }
    if (customerPhone) {
      params.customerPhone = customerPhone;
    }

    // Generate signature
    params.sign = this._generateSign(params);

    try {
      const response = await this.client.post('/api/createorder', params);
      
      if (response.data.code === 1) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Create order failed');
      }
    } catch (error) {
      if (error.response) {
        // API returned error response
        throw new Error(error.response.data.message || error.response.data.error || 'Create order failed');
      } else if (error.request) {
        // Request sent but no response received
        throw new Error('Network error: No response from server');
      } else {
        // Other errors
        throw error;
      }
    }
  }

  /**
   * Query order
   * 
   * @param {Object} options - Query parameters
   * @param {string} [options.orderId] - Order ID (required when querying a single order)
   * @param {number} [options.limit=10] - Records per page (max 50, default 10)
   * @param {number} [options.page=1] - Page number (default 1)
   * @returns {Promise<Object>} Order information or order list
   * 
   * @example
   * // Query single order
   * const order = await gateway.queryOrder({ orderId: 'abc123...' });
   * 
   * // Query order list
   * const orders = await gateway.queryOrder({ limit: 20, page: 1 });
   */
  async queryOrder(options = {}) {
    const { orderId, limit = 10, page = 1 } = options;

    // Build request parameters
    const params = {
      appid: this.appId,
      apikey: this.apiKey,
      action: orderId ? 'order' : 'orders',
      limit: Math.min(limit, 50), // Max 50
      page: page
    };

    if (orderId) {
      params.orderId = orderId;
    }

    // Generate signature
    params.sign = this._generateSign(params);
    params.sign_type = 'MD5';

    try {
      const response = await this.client.get('/api/order', { params });
      
      if (response.data.code === 1) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Query order failed');
      }
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || error.response.data.error || 'Query order failed');
      } else if (error.request) {
        throw new Error('Network error: No response from server');
      } else {
        throw error;
      }
    }
  }

  /**
   * Check order status (public endpoint, no authentication required)
   * 
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order status information
   * 
   * @example
   * const status = await gateway.checkOrderStatus('abc123...');
   * console.log('Status:', status.status); // pending, ready, paid, failed, cancelled
   * console.log('Status Code:', status.statusCode); // 0, 1, 2, 3, 4
   */
  async checkOrderStatus(orderId) {
    if (!orderId) {
      throw new Error('orderId is required');
    }

    try {
      const response = await this.client.get(`/api/order/status/${orderId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Check order status failed');
      } else if (error.request) {
        throw new Error('Network error: No response from server');
      } else {
        throw error;
      }
    }
  }

  /**
   * Get exchange rate (public endpoint, no authentication required)
   * 
   * @returns {Promise<Object>} Exchange rate information
   * 
   * @example
   * const rate = await gateway.getExchangeRate();
   * console.log('USD to CNY:', rate.data.exchangeRate);
   */
  async getExchangeRate() {
    try {
      const response = await this.client.get('/api/config/exchange-rate');
      
      if (response.data.code === 1) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Get exchange rate failed');
      }
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Get exchange rate failed');
      } else if (error.request) {
        throw new Error('Network error: No response from server');
      } else {
        throw error;
      }
    }
  }
}

module.exports = PaymentGateway;
