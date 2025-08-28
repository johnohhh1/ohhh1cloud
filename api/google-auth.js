// api/google-auth.js
// Bulletproof dependency-free service account authentication

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🤖 Starting bulletproof service account auth...');

    // Get environment variables
    const projectId = process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({ 
        error: 'Missing service account configuration',
        details: `Missing: ${!projectId ? 'PROJECT_ID ' : ''}${!clientEmail ? 'EMAIL ' : ''}${!privateKeyRaw ? 'PRIVATE_KEY' : ''}`
      });
    }

    // Fix private key formatting (handle \n escaping)
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    console.log('🔑 Private key formatted, length:', privateKey.length);

    // Validate private key format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Invalid private key format');
    }

    // Create JWT for Google OAuth 2.0
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour

    // JWT Header
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    // JWT Payload
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: exp,
      iat: now
    };

    console.log('📝 JWT payload created for:', clientEmail);

    // Base64URL encode (compatible with Node.js)
    const base64UrlEncode = (obj) => {
      return Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    console.log('🔐 Creating signature...');

    // Import crypto dynamically
    const { createSign } = await import('crypto');
    
    // Create signature
    const signer = createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(privateKey, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Complete JWT
    const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
    console.log('✅ JWT created, length:', jwt.length);

    // Exchange JWT for access token
    console.log('🔄 Exchanging JWT for access token...');
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      }).toString()
    });

    console.log('📡 Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('🎫 Access token received, expires in:', tokenData.expires_in);

    if (!tokenData.access_token) {
      throw new Error('No access token in response');
    }

    console.log('✅ Service account authentication successful!');

    // Return the access token
    res.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in || 3600,
      token_type: tokenData.token_type || 'Bearer'
    });

  } catch (error) {
    console.error('🚨 Service account auth error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      error: 'Service account authentication failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
