const jwt = require('jsonwebtoken');

function authenticateAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  console.log(req.cookies, "token in authenticateAdmin middleware");
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authenticateAdmin;