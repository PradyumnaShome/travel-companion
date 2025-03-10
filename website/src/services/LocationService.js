export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const placeInfo = await searchPlace({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
          resolve(placeInfo);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let message = 'Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Accès à la localisation refusé';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position non disponible';
            break;
          case error.TIMEOUT:
            message = 'Délai d\'attente dépassé';
            break;
          default:
            message = 'Erreur inconnue';
        }
        reject(new Error(message));
      }
    );
  });
};

export const getPlaceFromCoords = async (coords) => {
  return searchPlace({ coords });
};

export const getPlaceFromAddress = async (address) => {
  return searchPlace({ address });
};

const searchPlace = async ({ address, coords }) => {
  try {
    const response = await fetch('http://' + process.env.REACT_APP_API_URL + '/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address, coords })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur API:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Afficher les données de débogage
    const event = new CustomEvent('showDebugPrompt', {
      detail: { message: `Réponse du serveur :\n\n${JSON.stringify(data, null, 2)}` }
    });
    window.dispatchEvent(event);

    return data;
  } catch (error) {
    console.error('Erreur lors de la recherche du lieu:', error);
    throw error;
  }
};

export default {
  getCurrentLocation,
  getPlaceFromCoords,
  getPlaceFromAddress
}; 