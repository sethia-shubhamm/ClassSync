import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies.token;
        
        // If no cookie, check Authorization header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7); // Remove 'Bearer ' prefix
            }
        }

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized - No token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user details from database
        const user = await User.findById(decoded.id).select('name email');
        
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized - User not found' });
        }
        
        req.user = { id: decoded.id, name: user.name, email: user.email };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
};
