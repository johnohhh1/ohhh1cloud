export class GooglePhotosManager {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }
    this.accessToken = accessToken;
  }

  async listAlbums(pageSize = 50) {
    try {
      const response = await fetch(
        `https://photoslibrary.googleapis.com/v1/albums?pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      const data = await response.json();
      return (data.albums || []).map((album) => ({
        id: album.id,
        name: album.title,
        count: album.mediaItemsCount,
      }));
    } catch (error) {
      console.error('Error listing Google Photos albums:', error);
      return [];
    }
  }

  async getAlbumPhotos(albumId, pageSize = 100) {
    try {
      const response = await fetch(
        'https://photoslibrary.googleapis.com/v1/mediaItems:search',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ albumId, pageSize }),
        }
      );
      const data = await response.json();
      return (data.mediaItems || []).map((item) => ({
        id: item.id,
        name: item.filename,
        url: `${item.baseUrl}=w2048-h1024`,
        thumbnail: `${item.baseUrl}=w400-h400`,
        source: 'googlePhotos',
      }));
    } catch (error) {
      console.error('Error getting photos from album:', error);
      return [];
    }
  }

  async watchAlbum(albumId, onNewImages, checkInterval = 30000) {
    let knownIds = new Set();
    let watching = true;

    const poll = async () => {
      if (!watching) return;
      const photos = await this.getAlbumPhotos(albumId);
      const newImages = photos.filter((p) => !knownIds.has(p.id));
      if (newImages.length > 0) {
        knownIds = new Set(photos.map((p) => p.id));
        onNewImages(newImages.map((img) => ({ ...img, isNew: true })));
      }
    };

    await poll();
    const intervalId = setInterval(poll, checkInterval);
    return () => {
      watching = false;
      clearInterval(intervalId);
    };
  }
}

export default GooglePhotosManager;
