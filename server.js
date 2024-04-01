const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Order = require('./models/order');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connection to the database established');
}).catch((error) => {
  console.error('Error connecting to the database:', error);
});

app.set("view engine", "ejs");
app.set('views', __dirname + '/views');

function validatePhoneNumber(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateAlphabets(input) {
  const alphabetRegex = /^[A-Za-z\s]+$/;
  return alphabetRegex.test(input);
}

function validateAlphanumeric(input) {
  const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
  return alphanumericRegex.test(input);
}

app.post('/process', async (req, res) => {
  const { name, address, city, province, postalCode, phone, email, product1, product2, product3, deliveryTime } = req.body;

  const errors = [];
  if (!name || !validateAlphabets(name.trim())) {
    errors.push("Name is required and should contain only alphabets.");
  }
  if (!address || !validateAlphanumeric(address.trim())) {
    errors.push("Address is required and should contain only alphabets and numbers.");
  }
  if (!city || !validateAlphabets(city.trim())) {
    errors.push("City is required and should contain only alphabets.");
  }
  if (!province || !validateAlphabets(province.trim())) {
    errors.push("Province is required and should contain only alphabets.");
  }
  if (!postalCode || !validateAlphanumeric(postalCode.trim())) {
    errors.push("Postal Code is required and should contain only alphabets and numbers.");
  }
  if (!phone) {
    errors.push("Phone number is required.");
  } else if (!validatePhoneNumber(phone.trim())) {
    errors.push("Phone number must be 10 digits.");
  }
  if (!email) {
    errors.push("Email is required.");
  } else if (!validateEmail(email.trim())) {
    errors.push("Invalid email format. Please enter a valid email address.");
  }

  const productQuantities = [parseInt(product1), parseInt(product2), parseInt(product3)];
  for (const quantity of productQuantities) {
    if (isNaN(quantity) || quantity < 0) {
      errors.push("Invalid quantity for products.");
      break;
    }
  }

  if (errors.length > 0) {
    const errorMessage = `
      <div style='border: 1px solid #ccc; padding: 10px; border-radius: 5px; background-color: #f8d7da;'>
        <h3 style='color: red;'>Error:</h3>
        ${errors.map(error => `<p style='color: red; font-weight: bold;'>${error}</p>`).join('')}
      </div>`;
    res.status(400).send(errorMessage);
    return;
  }

  const prices = {
    'product1': 5,
    'product2': 8,
    'product3': 10
  };

  const totalAmount1 = prices['product1'] * productQuantities[0];
  const totalAmount2 = prices['product2'] * productQuantities[1];
  const totalAmount3 = prices['product3'] * productQuantities[2];
  const totalAmount = totalAmount1 + totalAmount2 + totalAmount3;

  if (totalAmount < 10) {
    const errorMessage = `
      <div style='border: 1px solid #ccc; padding: 10px; border-radius: 5px; background-color: #f8d7da;'>
        <h3 style='color: red;'>Error:</h3>
        <p style='color: red; font-weight: bold;'>Minimum purchase should be $10 or more.</p>
      </div>`;
    res.status(400).send(errorMessage);
    return;
  }

  const taxRates = {
    'Ontario': 0.13,
    'Alberta': 0.10,
    'Nova Scotia': 0.15,
  };

  const shippingCharges = {
    '7': 3,
    '5': 5,
    '2': 10
  };

  const shippingCharge = shippingCharges[deliveryTime];

  const taxAmount = totalAmount * 0.13;

  const totalAmountWithTax = totalAmount + shippingCharge + taxAmount;

  try {
    const savedOrder = await Order.create({
      name,
      address,
      city,
      province,
      postalCode,
      phone,
      email,
      product1: productQuantities[0],
      product2: productQuantities[1],
      product3: productQuantities[2],
      totalAmountWithTax,
      taxAmount,
      product1TotalAmount: totalAmount1,
      product2TotalAmount: totalAmount2,
      product3TotalAmount: totalAmount3,
      shippingCharge
    });

    console.log('Order saved successfully:', savedOrder);

    const receipt = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h2 style="text-align: center; margin-bottom: 20px;">Receipt</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Description</th>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Quantity</th>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Price per Item</th>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Total Price</th>
            </tr>
            <tr>
                <td style="border: 1px solid #dddddd; padding: 8px;">Product 1</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">${product1}</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$5.00</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$${totalAmount1.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dddddd; padding: 8px;">Product 2</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">${product2}</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$8.00</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$${totalAmount2.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dddddd; padding: 8px;">Product 3</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">${product3}</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$10.00</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$${totalAmount3.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="3" style="border: 1px solid #dddddd; text-align: right; padding: 8px;">Subtotal</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$${totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="3" style="border: 1px solid #dddddd; text-align: right; padding: 8px;">Shipping Charge</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$${shippingCharge.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="3" style="border: 1px solid #dddddd; text-align: right; padding: 8px;">Tax (13%)</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">$${taxAmount.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="3" style="border: 1px solid #dddddd; text-align: right; padding: 8px; font-weight: bold;">Total Amount</td>
                <td style="border: 1px solid #dddddd; padding: 8px; font-weight: bold;">$${totalAmountWithTax.toFixed(2)}</td>
            </tr>
        </table>
        <button onclick="window.location.href='/orders_history'" style="display: block; margin: 20px auto; padding: 10px 20px; background-color: #007bff; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Orders History</button>
    </div>
    `;
    

    res.send(receipt);
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).send('Error saving order');
  }
});

app.get('/orders_history', async (req, res) => {
  try {
    const orders = await Order.find();
    res.render('orders_history', { orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Error fetching orders');
  }
});

app.get('/', (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
