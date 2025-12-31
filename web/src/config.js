const config = {
  // Priority: 1. Environment Variable, 2. Hardcoded Production Fallback, 3. Localhost
  apiUrl: 'https://escapevr-server.onrender.com'
};

// Log to see what was chosen during build/runtime
if (typeof window !== 'undefined') {
  console.log('[Config] API URL set to:', config.apiUrl);
}

export default config;
