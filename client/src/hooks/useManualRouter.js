import { useState, useEffect } from 'react';

export const useManualRouter = () => {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [search, setSearch] = useState(window.location.search);

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
      setSearch(window.location.search);
    };

    // Listen for browser navigation
    window.addEventListener('popstate', handleLocationChange);
    
    // Check for changes periodically (for programmatic navigation)
    const interval = setInterval(handleLocationChange, 100);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  const navigate = (path, options = {}) => {
    if (options.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setPathname(path.split('?')[0]);
    setSearch(path.includes('?') ? path.split('?')[1] : '');
  };

  const location = {
    pathname,
    search,
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
