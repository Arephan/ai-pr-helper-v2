export const config = {
  apiKey: 'sk-prod-1234567890abcdef',  // Hardcoded secret
  dbPassword: 'MyP@ssw0rd123',          // Hardcoded password
  jwtSecret: 'secret123'                 // Weak secret
};

export const API_URL = process.env.API_URL || 'https://api.example.com';
