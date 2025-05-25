import db from "../database/database.js"
import Stripe from 'stripe';
import env from 'dotenv'
env.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


const saveOrder = async (req, res) => {
  console.log({ ordersave: req.body })
  const { StripePaymentId, StripeDeductedAmount, StripePaymentStatus, Data, CardHolderName } = req.body;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Save order main data
    const [orderResult] = await connection.query(
      `INSERT INTO orders (userId, username, email, phoneNumber, cardHolderName, totalAmount, stripePaymentId, PaymentDeductedAmount, stripePaymentStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Data.userId,
        Data.userDetail.username,
        Data.userDetail.email,
        Data.userDetail.phone,
        CardHolderName,
        Data.totalAmount,
        StripePaymentId,
        StripeDeductedAmount,
        StripePaymentStatus,
      ]
    );

    const orderInsertId = orderResult.insertId;

    // Save ordered products
    const insertPromises = (Data.orderedproducts).map(item => {
      return connection.query(
        `INSERT INTO order_items (orderId, productId, productSlug, productName, productImage, size, color, gender, quantity, unitPrice, totalPrice)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderInsertId,
          item.productId,
          item.productSlug,
          item.productName,
          item.productImage,
          item.productSize,
          item.productColor,
          item.gender,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
        ]
      );
    })

    await Promise.all(insertPromises)

    // Save shipping address
    await connection.query(
      `INSERT INTO shipping_addresses (orderId, userId, fullname, street, city, state, postalCode, country, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderInsertId,
        Data.userid,
        Data.shippingAddress.fullname,
        Data.shippingAddress.street,
        Data.shippingAddress.city,
        Data.shippingAddress.state,
        Data.shippingAddress.postalCode,
        Data.shippingAddress.country,
        Data.shippingAddress.phone,
      ]
    );

    await connection.commit()
    connection.release()

    res.status(200).json({ message: 'Order saved successfully' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Failed to save order:", error);
    res.status(500).json({ message: 'Failed to save order' });
  }
}

const getOrder = async (req, res) => {

  return res.status(200).json({ message: 'get order api work' })
}


const getUserOrder = async (req, res) => {
  // const userId = req.user?.id || req.query.userId; // depends on your auth implementation
  const userId = req.params.id
  console.log({ cUserId: userId })
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Get all orders by userId
    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
    console.log({order:orders})

    if (orders.length === 0) {
      return res.status(200).json({ orders: [] });
    }

    // For each order, get items and shipping address
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const [items] = await connection.query(
        `SELECT * FROM order_items WHERE orderId = ?`,
        [order.id]
      );
      

      const [shipping] = await connection.query(
        `SELECT * FROM shipping_addresses WHERE orderId = ?`,
        [order.id]
      );

      return {
        ...order,
        items,
        shippingAddress: shipping[0] || null,
      };
    }));
    console.log({enrichedOrders:enrichedOrders})

    connection.release();
    res.status(200).json({ orders: enrichedOrders });

  } catch (error) {
    if (connection) connection.release();
    console.error("Failed to fetch user orders:", error);
    res.status(500).json({ message: 'Failed to fetch user orders' });
  }
};


const paymentIntent = async (req, res) => {
  try {
    const { amount } = await req.body;
    console.log({ paymentIntentAPIamount: amount })
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'], // ✅ Only allow cards
      automatic_payment_methods: { enabled: false }, // ✅ Prevent Stripe from enabling Link, etc.
    });
    console.log({ paymentIntent: paymentIntent.client_secret })
    return res.status(200).json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    return res.status(500).json({ error: error })
  }
}



export const controller = {
  saveOrder,
  getOrder,
  getUserOrder,
  paymentIntent
}