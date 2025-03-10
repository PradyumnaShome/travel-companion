import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());

// Configuration CORS flexible
app.use(cors({
  origin: function(origin, callback) {
    console.log("Origin:", origin);
    // Autoriser les requêtes sans origine (ex: Postman, curl)
    if (!origin) return callback(null, true);
    
    // En développement, accepter localhost sur n'importe quel port
    if (process.env.NODE_ENV === 'development' && origin.match(/^http:\/\/localhost:/)) {
      return callback(null, true);
    }
    
    // En production, vous pouvez ajouter une liste d'origines autorisées
    const allowedOrigins = process.env.REACT_APP_ALLOWED_ORIGINS ? process.env.REACT_APP_ALLOWED_ORIGINS.split(',') : [];
    console.log("Allowed Origins:", allowedOrigins);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Permet l'envoi de cookies si nécessaire
  maxAge: 86400 // Cache la réponse preflight pendant 24h
}));

const GOOGLE_CSE_ID = process.env.REACT_APP_GOOGLE_CSE_ID; // ID du moteur de recherche personnalisé
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

async function getPlaceImage(placeName) {
  try {
    // 1. D'abord essayer Google Custom Search
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(placeName)}&searchType=image&num=1`;
    
    const response = await fetch(searchUrl);
    console.log("Google Custom Search URL:", searchUrl);
    console.log("Google Custom Search Response:", response);
    const data = await response.json();
    
    if (data.items && data.items[0]?.link) {
      return data.items[0].link;
    }
    
    // 2. Fallback vers Wikimedia si pas d'image Google
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(placeName)}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
    
    const wikiResponse = await fetch(wikiUrl);
    const wikiData = await wikiResponse.json();
    
    if (wikiData.query?.pages) {
      const page = Object.values(wikiData.query.pages)[0];
      return page.imageinfo?.[0]?.url;
    }

    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image:', error);
    return null;
  }
}

const generatePrompt = (location, targetLanguage = 'fr') => `
You are an expert travel assistant analyzing the location "${location}". 

Important: Use the COMPLETE address to determine the correct location. Do not assume the location based on partial matches (e.g., don't assume "5th Avenue" is in New York unless explicitly specified).

Provide:
1. The main local language spoken in this EXACT location
2. 3 recommended places within a 5-10 minute walking radius
3. 3 useful contextual dialogues with phonetic pronunciations

For languages that use non-Latin scripts (e.g., Japanese, Chinese, Korean, Thai, Arabic, etc.), provide a simple phonetic pronunciation guide using Latin characters. The pronunciation should be simple and intuitive, NOT using IPA symbols. For example:
- Japanese "こんにちは" → "kon-nee-chee-wah"
- Chinese "你好" → "nee-how"
- Thai "สวัสดี" → "sa-wat-dee"

All descriptions and translations should be in ${targetLanguage}.

Expected JSON format:
{
  "localLanguage": {
    "code": "local language ISO code (e.g., en, ja, es)",
    "name": "local language name in ${targetLanguage}",
    "nativeName": "language name in the local language"
  },
  "topItems": [
    {
      "name": "Place name",
      "description": "Description in ${targetLanguage} (10 words maximum)",
      "type": "restaurant|cafe|bar|museum|shop|attraction",
      "pronunciation": "Simple phonetic pronunciation in Latin characters"
    }
  ],
  "dialogs": [
    {
      "type": "general|directions|shopping|emergency",
      "prompt": "Dialog title in ${targetLanguage}",
      "messages": [
        {
          "speaker": "tourist|local",
          "text": "Text in local language (10 words maximum)",
          "pronunciation": "Simple phonetic pronunciation in Latin characters",
          "translation": "Translation in ${targetLanguage}"
        }
      ]
    }
  ]
}

Ensure that:
1. Dialog types cover: general conversations, directions, shopping/information, and emergencies
2. Dialogues are relevant to the local context
3. Each recommended place has a specific type for appropriate default image display
4. ALWAYS include phonetic pronunciations for non-Latin script languages
5. Make pronunciations simple and intuitive for tourists to read
6. I need valid JSON, with no unnecessary whitespace or formatting. Avoid using backticks.`;

// Endpoint unifié pour la recherche de lieu et les recommandations
app.post('/api/search', async (req, res) => {
  const { address, coords, targetLanguage } = req.body;
  
  try {
    // Obtenir les coordonnées via géocodage si une adresse est fournie
    let location;
    if (address) {
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.results?.[0]) {
        throw new Error('Adresse non trouvée');
      }
      
      location = {
        latitude: geocodeData.results[0].geometry.location.lat,
        longitude: geocodeData.results[0].geometry.location.lng
      };
    } else if (coords) {
      location = coords;
    } else {
      throw new Error('Adresse ou coordonnées requises');
    }

    // Obtenir les détails du lieu via géocodage inversé
    const reverseGeocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await reverseGeocodeResponse.json();
    if (!data.results?.[0]) {
      throw new Error('Aucune information de lieu trouvée');
    }

    // Le premier résultat est généralement l'adresse la plus précise
    const exactLocation = data.results[0];
    
    // Trouver les informations pertinentes dans les résultats
    const findAddressOfType = (type) => 
      data.results.find(result => result.types.includes(type))?.formatted_address;

    // Extraire les composants d'adresse du résultat le plus précis
    const addressComponents = exactLocation.address_components;
    const getComponent = (type) => 
      addressComponents.find(c => c.types.includes(type))?.long_name;

    const place = {
      name: exactLocation.formatted_address.split(',')[0],
      address: exactLocation.formatted_address,
      coords: { lat: location.latitude, lng: location.longitude },
      city: getComponent('locality'),
      region: getComponent('administrative_area_level_1'),
      country: getComponent('country'),
      neighborhood: findAddressOfType('neighborhood') || findAddressOfType('sublocality'),
      nearbyContext: data.results
        .slice(0, 5)
        .map(r => r.formatted_address)
        .filter(addr => addr !== exactLocation.formatted_address)
    };

    // Obtenir les recommandations pour ce lieu
    const recommendationsResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: generatePrompt(place.address, targetLanguage)
        }]
      })
    });
  
    if (!recommendationsResponse.ok) {
      const errorData = await recommendationsResponse.text();
      console.error('Erreur Claude:', {
        status: recommendationsResponse.status,
        statusText: recommendationsResponse.statusText,
        data: errorData
      });
      throw new Error(`Erreur API Claude: ${recommendationsResponse.
      status} ${recommendationsResponse.statusText}`);
    }
  
    const recommendationsData = await recommendationsResponse.json();
    console.log(recommendationsData);
    
    // Nettoyer la réponse de Claude des marqueurs Markdown
    const cleanedResponse = recommendationsData.content[0].text
      .replace(/```json\n?/g, '')  // Supprime ```json et le saut de ligne optionnel
      .replace(/```/g, '')         // Supprime les ``` de fermeture
      .trim();                     // Supprime les espaces en début/fin
    
    const recommendations = JSON.parse(cleanedResponse);
  
    // Ajouter les images par défaut aux lieux recommandés
    recommendations.topItems = recommendations.topItems.map(item => ({
      ...item,
      image: item.image
    }));
  
    res.json({ ...place, ...recommendations });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});
  
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
}); 