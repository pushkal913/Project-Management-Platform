// Redirect Blocker Bypass Script
// This script detects redirect blocking and handles it

window.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a page that needs authentication
  const path = window.location.pathname;
  const protectedRoutes = ['/dashboard', '/projects', '/tasks', '/users', '/profile', '/settings'];
  const publicRoutes = ['/login', '/register'];
  
  // Function to check authentication
  function isAuthenticated() {
    return localStorage.getItem('token') && localStorage.getItem('user');
  }
  
  // Function to handle authentication redirect
  function handleAuthRedirect() {
    const isAuth = isAuthenticated();
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isPublicRoute = publicRoutes.includes(path);
    
    // If user is not authenticated and on protected route
    if (!isAuth && isProtectedRoute) {
      // Use location.replace to avoid history issues
      window.location.replace('/login');
      return;
    }
    
    // If user is authenticated and on public route
    if (isAuth && isPublicRoute) {
      // Use location.replace to avoid history issues
      window.location.replace('/dashboard');
      return;
    }
  }
  
  // Check auth status after a small delay
  setTimeout(handleAuthRedirect, 100);
});

// Handle login success redirects
window.addEventListener('loginSuccess', function() {
  window.location.replace('/dashboard');
});

// Handle logout redirects
window.addEventListener('logout', function() {
  window.location.replace('/login');
});
