import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Get the correct socket URL based on environment
      const getSocketUrl = () => {
        if (process.env.REACT_APP_SOCKET_URL) {
          return process.env.REACT_APP_SOCKET_URL;
        }
        
        // Determine URL based on current location
        if (window.location.hostname === 'localhost') {
          return 'http://localhost:5000';
        } else {
          // Use the backend URL for production
          return 'https://project-management-api.onrender.com';
        }
      };

      const socketUrl = getSocketUrl();
      console.log('Connecting to socket at:', socketUrl);

      // Initialize socket connection
      const newSocket = io(socketUrl, {
        auth: {
          userId: user.id
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        setConnectionAttempts(0);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server, reason:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
        setConnectionAttempts(prev => prev + 1);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        setConnected(true);
        setConnectionAttempts(0);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Reconnection failed:', error);
        setConnectionAttempts(prev => prev + 1);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Failed to reconnect after maximum attempts');
        setConnected(false);
      });

      // Listen for real-time updates
      newSocket.on('project-created', (data) => {
        toast.info(`New project created: ${data.project.name}`);
      });

      newSocket.on('project-updated', (data) => {
        toast.info(`Project updated: ${data.project.name}`);
      });

      newSocket.on('task-created', (data) => {
        toast.info(`New task created: ${data.task.title}`);
      });

      newSocket.on('task-updated', (data) => {
        toast.info(`Task updated: ${data.task.title}`);
      });

      newSocket.on('task-comment-added', (data) => {
        toast.info('New comment added to task');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user]); // Remove 'socket' from dependency array to prevent infinite loop

  const joinProject = (projectId) => {
    if (socket) {
      socket.emit('join-project', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket) {
      socket.emit('leave-project', projectId);
    }
  };

  const emitTaskUpdate = (taskData) => {
    if (socket) {
      socket.emit('task-update', taskData);
    }
  };

  const value = {
    socket,
    connected,
    connectionAttempts,
    joinProject,
    leaveProject,
    emitTaskUpdate
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
