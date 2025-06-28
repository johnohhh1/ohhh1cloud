// /api/gdrive-proxy.js
export default async function handler(req, res) {
  // Get fileId and token from query parameters
  const { fileId, token } = req.query;
  
  if (!fileId || !token) {
    console.error('Missing parameters:', { fileId: !!fileId, token: !!token });
    return res.status(400).json({ error: 'Missing required parameters: fileId and token' });
  }
  
  try {
    // Call Google Drive API to get the file
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Google Drive API error',
        status: response.status,
        statusText: response.statusText,
        googleError: errorText
      });
    }
    
    // Get content type from response headers
    const contentType = response.headers.get('content-type');
    
    // Set appropriate content-type header
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    
    // Allow caching of images for better performance
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Get the file data as array buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Send the file data
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error fetching Google Drive file:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file from Google Drive',
      details: error.message
    });
  }
}
