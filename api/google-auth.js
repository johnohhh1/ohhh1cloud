// api/google-auth.js
// Bulletproof service account authentication

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log that we're starting (for debugging)
    console.log('🤖 Service account auth starting...');

    // Check environment variables exist
    const projectId = process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({ 
        error: 'Missing service account configuration',
        missing: {
          projectId: !projectId,
          clientEmail: !clientEmail,
          privateKey: !privateKeyRaw
        }
      });
    }

    // Fix private key formatting (handle \n properly)
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    console.log('🔑 Private key formatted');

    // Import Google Auth library dynamically
    const { GoogleAuth } = await import('google-auth-library');
    console.log('📚 Google Auth library imported');

    // Create auth instance
    const auth = new GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: projectId,
        private_key: privateKey,
        client_email: clientEmail,
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    console.log('🔐 Auth client created');

    // Get access token
    const authClient = await auth.getClient();
    console.log('👤 Auth client obtained');

    const accessTokenResponse = await authClient.getAccessToken();
    console.log('🎫 Access token obtained');

    if (!accessTokenResponse.token) {
      throw new Error('No access token returned');
    }

    console.log('✅ Service account authentication successful');

    // Return the access token
    res.status(200).json({ 
      access_token: accessTokenResponse.token,
      expires_in: 3600,
      token_type: 'Bearer'
    });

  } catch (error) {
    console.error('🚨 Service account auth error:', error);
    
    // Return detailed error for debugging
    res.status(500).json({ 
      error: 'Service account authentication failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
