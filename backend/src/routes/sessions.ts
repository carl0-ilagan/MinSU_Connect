import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

const router = express.Router();

// Get all sessions for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' }
    });

    const formattedSessions = sessions.map(session => {
      const ua = new UAParser(session.userAgent);
      const geo = geoip.lookup(session.ip);
      
      return {
        id: session.id,
        device: `${ua.getDevice().vendor || ''} ${ua.getDevice().model || 'Unknown Device'}`.trim(),
        browser: `${ua.getBrowser().name} ${ua.getBrowser().version}`,
        location: geo ? `${geo.city}, ${geo.country}` : 'Unknown Location',
        ip: session.ip,
        lastActive: session.lastActive,
        isCurrent: session.id === req.sessionId
      };
    });

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Delete a specific session
router.delete('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify the session belongs to the user
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Don't allow deleting the current session
    if (session.id === req.sessionId) {
      return res.status(400).json({ error: 'Cannot delete current session' });
    }

    await prisma.session.delete({
      where: { id: sessionId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router; 