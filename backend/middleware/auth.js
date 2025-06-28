const { getAuth } = require("@clerk/express");

const authenticateUser = (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    req.user = {
      sub: auth.userId,
      email: auth.sessionClaims?.email,
      first_name: auth.sessionClaims?.given_name,
      last_name: auth.sessionClaims?.family_name,
      image_url: auth.sessionClaims?.picture,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Authentication failed",
      message: error.message,
    });
  }
};

module.exports = { authenticateUser };
