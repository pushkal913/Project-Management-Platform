import { useState, useEffect } from 'react';

// Singleton router state
let routerState = {
  pathname: window.location.pathname,
  search: window.location.search,
  listeners: new Set(),
  initialized: false
};

const updateRouterState = () => {
  const newPathname = window.location.pathname;
  const newSearch = window.location.search;
  
  if (newPathname !== routerState.pathname || newSearch !== routerState.search) {
    routerState.pathname = newPathname;
    routerState.search = newSearch;
    
    // Notify all listeners
    routerState.listeners.forEach(listener => listener());
  }
};

const initializeRouter = () => {
  if (routerState.initialized) return;
  
  // Listen for browser navigation
  window.addEventListener('popstate', updateRouterState);
  
  routerState.initialized = true;
};

export const useManualRouter = () => {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    initializeRouter();
    
    // Add this component as a listener
    const listener = () => forceUpdate({});
    routerState.listeners.add(listener);
    
    return () => {
      routerState.listeners.delete(listener);
    };
  }, []);

  const navigate = (path, options = {}) => {
    if (options.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    updateRouterState();
  };

  const location = {
    pathname: routerState.pathname,
    search: routerState.search,
    hash: window.location.hash,
    state: window.history.state
  };

  return { navigate, location };
};

export const useNavigate = () => {
  const { navigate } = useManualRouter();
  return navigate;
};

export const useLocation = () => {
  const { location } = useManualRouter();
  return location;
};

export const useParams = () => {
  const { location } = useManualRouter();
  const path = location.pathname;
  
  // Simple param extraction for common routes
  if (path.startsWith('/projects/')) {
    const id = path.split('/projects/')[1];
    return { id };
  }
  if (path.startsWith('/tasks/')) {
    const id = path.split('/tasks/')[1];
    return { id };
  }
  
  return {};
};
