const mongoose = require('mongoose');

// Define schema for orders collection
const orderSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  province: String,
  postalCode: String,
  phone: String,
  email: String,
  product1: Number,
  product2: Number,
  product3: Number,
  product1TotalAmount: Number,
  product2TotalAmount: Number,
  product3TotalAmount: Number,
  taxAmount: Number,
  shippingCharge: Number,
  totalAmountWithTax: Number,
  timestamp: { type: Date, default: Date.now }
});

// Create model for orders collection
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;