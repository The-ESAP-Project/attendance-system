const jwt = require('jsonwebtoken');
const { userLimiter, adminLimiter } = require('./limiter');

async function jwtParser(req, res, next) {
    const requestPath = req.originalUrl;
    const deployRoute = process.env.API_BASE_ROUTE || '';

    if(requestPath.startsWith(`${deployRoute}/auth/`)){
        return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ code: -1, message: 'Authorization token missing', data: null });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ code: -1, message: 'Unauthorized - Token verification failed', data: null });
        }

        req.user = decoded;
        const { username, role } = decoded;

        if (!username || !role) {
            return res.status(401).json({ code: -1, message: 'Invalid token structure', data: null });
        }

        if (requestPath.startsWith(`${deployRoute}/sport/`)) {
            return userLimiter(req, res, next);
        } else if (requestPath.startsWith(`${deployRoute}/student/`)) {
            return userLimiter(req, res, next);
        } else if (requestPath.startsWith(`${deployRoute}/user/`) && role === 'superadmin') {
            return adminLimiter(req, res, next);
        } else {
            return res.status(403).json({ code: -1, message: 'Access denied', data: null });
        }
        
    } catch (error) {
        return res.status(401).json({ code: -1, message: 'Unauthorized - Token verification failed', data: null });
    }
}

module.exports = jwtParser;