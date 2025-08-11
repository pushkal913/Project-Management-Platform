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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          userId: user.id
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
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
  }, [user]);

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
