import { FAKE_PLACES, SAMPLE_DATA } from '../data/sampleData';

const FOURSQUARE_API_KEY = process.env.REACT_APP_FOURSQUARE_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

export const getPlacesNearby = async (location) => {
  try {
    // Try Foursquare API first
    const response = await fetch(
      `https://api.foursquare.com/v3/places/search?ll=${location.coords.lat},${location.coords.lng}&radius=1000&limit=10`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: FOURSQUARE_API_KEY
        }
      }
    );
    
    const data = await response.json();
    
    if (data.results) {
      const places = data.results.map(place => ({
        name: place.name,
        type: getPlaceType(place.categories),
        address: place.location.formatted_address,
        language: detectLanguage(place.location.country),
        id: place.fsq_id
      }));
      
      return [...places, ...FAKE_PLACES];
    }
  } catch (error) {
    console.error('Error fetching places:', error);
  }
  
  // Fallback to sample data
  return FAKE_PLACES;
};

export const getPlaceDetails = async (place) => {
  try {
    if (place.id) {
      // Try Foursquare API for details
      const response = await fetch(
        `https://api.foursquare.com/v3/places/${place.id}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: FOURSQUARE_API_KEY
          }
        }
      );
      
      const data = await response.json();
      
      // Use GPT to generate relevant phrases and items
      const gptResponse = await fetch('/api/generate-place-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place: data,
          type: place.type
        })
      });
      
      const gptData = await gptResponse.json();
      return gptData;
    }
  } catch (error) {
    console.error('Error fetching place details:', error);
  }
  
  // Fallback to sample data
  return SAMPLE_DATA[place.type]?.[place.language] || generateFallbackData(place);
};

const getPlaceType = (categories) => {
  const categoryMap = {
    'Museum': ['museum', 'art gallery', 'historic site'],
    'Store': ['shop', 'store', 'retail'],
    'Restaurant': ['restaurant', 'food'],
    'Cafe': ['cafe', 'coffee shop'],
    'Bar': ['bar', 'pub', 'nightlife']
  };
  
  for (const [type, keywords] of Object.entries(categoryMap)) {
    if (categories.some(cat => 
      keywords.some(keyword => 
        cat.name.toLowerCase().includes(keyword)
      )
    )) {
      return type.toLowerCase();
    }
  }
  
  return 'other';
};

const detectLanguage = (country) => {
  const languageMap = {
    'IT': 'Italian',
    'FR': 'French',
    'ES': 'Spanish',
    'JP': 'Japanese',
    'CN': 'Chinese'
  };
  
  return languageMap[country] || 'English';
};

const generateFallbackData = (place) => {
  const typeData = {
    museum: {
      topItems: [
        { name: "Featured Exhibition", pronunciation: "View current exhibitions", image: "/images/exhibition.jpg" },
        { name: "Permanent Collection", pronunciation: "Main gallery highlights", image: "/images/gallery.jpg" },
        { name: "Special Events", pronunciation: "Upcoming events", image: "/images/events.jpg" }
      ],
      dialogs: [
        {
          prompt: "Buy Tickets",
          messages: [
            { speaker: "tourist", text: "I'd like to buy tickets for today.", translation: "Basic admission" },
            { speaker: "staff", text: "Regular or special exhibition?", translation: "Choose ticket type" }
          ]
        }
      ]
    },
    store: {
      topItems: [
        { name: "Featured Items", pronunciation: "Current bestsellers", image: "/images/featured.jpg" },
        { name: "New Arrivals", pronunciation: "Latest products", image: "/images/new.jpg" },
        { name: "Special Offers", pronunciation: "Current deals", image: "/images/deals.jpg" }
      ],
      dialogs: [
        {
          prompt: "Ask for Help",
          messages: [
            { speaker: "tourist", text: "Could you help me find...", translation: "Request assistance" },
            { speaker: "staff", text: "Of course! What are you looking for?", translation: "Staff response" }
          ]
        }
      ]
    }
  };
  
  return typeData[place.type] || SAMPLE_DATA.restaurant.English;
};

export const searchPlaces = async (query, location) => {
  try {
    const response = await fetch(
      `https://api.foursquare.com/v3/places/search?query=${query}&ll=${location.coords.lat},${location.coords.lng}&radius=5000&limit=10`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: FOURSQUARE_API_KEY
        }
      }
    );
    
    const data = await response.json();
    
    if (data.results) {
      return data.results.map(place => ({
        name: place.name,
        type: getPlaceType(place.categories),
        address: place.location.formatted_address,
        language: detectLanguage(place.location.country),
        id: place.fsq_id
      }));
    }
  } catch (error) {
    console.error('Error searching places:', error);
  }
  
  return [];
}; 