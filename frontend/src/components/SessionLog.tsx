import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import { format } from 'date-fns';
import { Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export const SessionLog: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete session');
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return <Typography>Loading sessions...</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Active Sessions</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchSessions}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {sessions.map((session) => (
          <Box
            key={session.id}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              position: 'relative'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  {session.device}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.browser}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.location}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  IP: {session.ip}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last active: {format(new Date(session.lastActive), 'PPpp')}
                </Typography>
              </Box>
              <Box>
                {session.isCurrent && (
                  <Chip
                    label="Current Session"
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )}
                {!session.isCurrent && (
                  <Tooltip title="End Session">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}; 