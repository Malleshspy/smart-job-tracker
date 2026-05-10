// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // 1. Get the token from the request headers (Format: "Bearer <token>")
    const token = req.header('Authorization').split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

    // 2. Verify the token using your secret key
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Attach the user's ID to the request object so the next function can use it
    req.user = verified.id;
    next(); // Pass control to the next function (the route handler)
    
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth;