const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const skillController = require('../controllers/skillController');
const listingController = require('../controllers/listingController');
const bookingController = require('../controllers/bookingController');
const reviewController = require('../controllers/reviewController');
const adminController = require('../controllers/adminController');

const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Auth Endpoints
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

// Skills Endpoints
router.get('/skills', skillController.getSkills);
router.post('/skills', authenticateToken, skillController.createSkill);

// Listings & Recommendation Engine Endpoints
router.post('/listings', authenticateToken, listingController.createListing);
router.get('/listings', listingController.getListings);
router.delete('/listings/:id', authenticateToken, listingController.deactivateListing);
router.get('/listings/matches', authenticateToken, listingController.getMatches);

// Bookings & Swapping Logic
router.post('/bookings', authenticateToken, bookingController.createBooking);
router.get('/bookings', authenticateToken, bookingController.getUserBookings);
router.patch('/bookings/:id/status', authenticateToken, bookingController.updateBookingStatus);

// Reviews
router.post('/reviews', authenticateToken, reviewController.createReview);
router.get('/reviews/user/:userId', reviewController.getReviewsForUser);

// Admin Control Panel Endpoints
router.get('/admin/stats', authenticateToken, requireAdmin, adminController.getSystemStats);
router.get('/admin/reports', authenticateToken, requireAdmin, adminController.getReports);
router.patch('/admin/reports/:id/resolve', authenticateToken, requireAdmin, adminController.resolveReport);
router.patch('/admin/users/:id/suspend', authenticateToken, requireAdmin, adminController.setUserSuspension);

module.exports = router;