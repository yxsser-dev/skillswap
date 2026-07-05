const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const skillController = require('../controllers/skillController');
const listingController = require('../controllers/listingController');
const bookingController = require('../controllers/bookingController');
const reviewController = require('../controllers/reviewController');
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const userController = require('../controllers/userController');

const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/securityMiddleware');
const { handleAvatarUpload, handleCertificateUpload } = require('../middleware/uploadMiddleware');

router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

router.get('/skills', skillController.getSkills);
router.post('/skills', authenticateToken, skillController.createSkill);

router.post('/listings', authenticateToken, listingController.createListing);
router.get('/listings', listingController.getListings);
router.get('/listings/matches', authenticateToken, listingController.getMatches);
router.get('/listings/:id', listingController.getListingById);
router.delete('/listings/:id', authenticateToken, listingController.deactivateListing);
router.post('/listings/:id/certificate', authenticateToken, handleCertificateUpload, listingController.uploadCertificate);

router.post('/bookings', authenticateToken, bookingController.createBooking);
router.get('/bookings', authenticateToken, bookingController.getUserBookings);
router.patch('/bookings/:id/status', authenticateToken, bookingController.updateBookingStatus);

router.post('/reviews', authenticateToken, reviewController.createReview);
router.get('/reviews/user/:userId', reviewController.getReviewsForUser);

router.patch('/users/me', authenticateToken, userController.updateMyProfile);
router.post('/users/me/avatar', authenticateToken, handleAvatarUpload, userController.uploadAvatar);
router.get('/users/:id', userController.getPublicProfile);
router.get('/users/:id/activity', userController.getUserActivity);

router.post('/reports', authenticateToken, reportController.createReport);

router.get('/admin/stats', authenticateToken, requireAdmin, adminController.getSystemStats);
router.get('/admin/reports', authenticateToken, requireAdmin, adminController.getReports);
router.patch('/admin/reports/:id/resolve', authenticateToken, requireAdmin, adminController.resolveReport);
router.get('/admin/users', authenticateToken, requireAdmin, adminController.getAllUsers);
router.patch('/admin/users/:id/suspend', authenticateToken, requireAdmin, adminController.setUserSuspension);
router.get('/admin/listings', authenticateToken, requireAdmin, adminController.getAllListings);
router.delete('/admin/listings/:id', authenticateToken, requireAdmin, adminController.forceDeleteListing);

module.exports = router;