// Minimal redirect handler - only handle login/logout, not navigation
window.addEventListener('DOMContentLoaded', function() {
  // Only handle login/logout events, not route-based redirects
  console.log('Redirect handler loaded');
});

// Handle login success redirects
window.addEventListener('loginSuccess', function() {
  console.log('Login success, redirecting to dashboard');
  setTimeout(() => {
    window.location.replace('/dashboard');
  }, 100);
});

// Handle logout redirects
window.addEventListener('logout', function() {
  console.log('Logout, redirecting to login');
  setTimeout(() => {
    window.location.replace('/login');
  }, 100);
});
