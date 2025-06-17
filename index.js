require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, messaging } = require('./firebaseAdmin');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Send notification endpoint
app.post('/sendNotification', async (req, res) => {
  try {
    const { parentUid, title, message } = req.body;

    // Validate required fields
    if (!parentUid || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: parentUid, title, and message are required'
      });
    }

    // Get parent's FCM token from Firestore
    const parentDoc = await db.collection(process.env.FIREBASE_COLLECTION).doc(parentUid).get();

    if (!parentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const parentData = parentDoc.data();
    const fcmToken = parentData.fcmToken;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'Parent device not registered for notifications'
      });
    }

    // Send notification using FCM
    const notification = {
      notification: {
        title,
        body: message
      },
      token: fcmToken
    };

    await messaging.send(notification);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 