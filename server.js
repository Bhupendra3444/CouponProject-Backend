// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Redis } = require('@upstash/redis');
const app = express();

// Redis setup

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})



// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Coupon configuration
const coupons = ['COUPON1', 'COUPON2', 'COUPON3', 'COUPON4', 'COUPON5'];
let currentIndex = 0;
const COOLDOWN = 3600; // 1 hour in seconds
app.get('/', (req, res) => {
    res.json("hello");
    
  });

// API Endpoint: Claim Coupon
app.post('/api/claim', async (req, res) => {
  const ip = req.ip;
  const clientCookie = req.cookies.couponClaimed;

  try {
    // Redis IP check
    const redisKey = `ip:${ip}`;
    const cooldownRemaining = await redisClient.ttl(redisKey);
    
    if (cooldownRemaining > 0) {
      return res.status(429).json({
        message: `Try again in ${Math.ceil(cooldownRemaining / 60)} minutes`
      });
    }

    // Cookie check
    if (clientCookie) {
      const cookieExpiry = new Date(clientCookie).getTime();
      const now = Date.now();
      if (cookieExpiry > now) {
        const remaining = Math.ceil((cookieExpiry - now) / 60000);
        return res.status(429).json({ message: `Try again in ${remaining} minutes` });
      }
    }

    // Assign coupon
    const coupon = coupons[currentIndex];
    currentIndex = (currentIndex + 1) % coupons.length;

    // Update Redis with IP cooldown
    await redisClient.set(redisKey, 'blocked', { ex: COOLDOWN });

    // Set cookie
    const expiryDate = new Date(Date.now() + COOLDOWN * 1000);
    res.cookie('couponClaimed', expiryDate, {
      maxAge: COOLDOWN * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ coupon, message: 'Coupon claimed successfully!' });

  } catch (error) {
    console.error('Error processing claim:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));