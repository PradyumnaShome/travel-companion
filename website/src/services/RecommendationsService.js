const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;

export const getPlaceRecommendations = async (location, placeInfo) => {
  try {
    const regionDetails = await getRegionDetails(location.coords);
    return await getClaudeRecommendations(regionDetails, placeInfo);
  } catch (error) {
    console.error('Erreur lors de l\'obtention des recommandations:', error);
    throw error;
  }
};

const getRegionDetails = async ({ lat, lng }) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_1|country&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (!data.results?.[0]) {
      throw new Error('Aucune information de région trouvée');
    }

    const result = data.results[0];
    const city = result.address_components.find(c => c.types.includes('locality'))?.long_name;
    const region = result.address_components.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
    const country = result.address_components.find(c => c.types.includes('country'))?.long_name;

    return {
      city,
      region,
      country,
      formattedAddress: result.formatted_address
    };
  } catch (error) {
    console.error('Erreur lors de l\'obtention des détails de la région:', error);
    throw error;
  }
};

const getClaudeRecommendations = async (regionDetails, placeInfo) => {
  try {
    const prompt = `En tant qu'expert local, recommande les 3 meilleures attractions ou expériences à ${regionDetails.city || regionDetails.region}, ${regionDetails.country}. 
    Pour chaque recommandation, fournis :
    - Un nom
    - Une brève description (max 2 phrases)
    - Une URL d'image Creative Commons ou libre de droits de Wikimedia Commons, Pexels, ou une autre source fiable
    Format JSON attendu :
    {
      "recommendations": [
        {
          "name": "Nom du lieu",
          "description": "Description brève",
          "image": "URL de l'image"
        }
      ]
    }
    Assure-toi que les URLs d'images sont valides et accessibles publiquement.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2025-02-19'
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la communication avec Claude');
    }

    const data = await response.json();
    return JSON.parse(data.content[0].text);
  } catch (error) {
    console.error('Erreur lors de l\'obtention des recommandations Claude:', error);
    throw error;
  }
};

export default {
  getPlaceRecommendations
}; 