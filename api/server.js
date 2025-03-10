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
    // Autoriser les requêtes sans origine (ex: Postman, curl)
    if (!origin) return callback(null, true);
    
    // En développement, accepter localhost sur n'importe quel port
    if (process.env.NODE_ENV === 'development' && origin.match(/^http:\/\/localhost:/)) {
      return callback(null, true);
    }
    
    // En production, vous pouvez ajouter une liste d'origines autorisées
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
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

// Endpoint unifié pour la recherche de lieu et les recommandations
app.post('/api/search', async (req, res) => {
  const { address, coords } = req.body;
  
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
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Tu es un expert local à ${place.city || place.region}, ${place.country}. 
          L'utilisateur se trouve à "${place.name}" (${place.address}).
          Le contexte du lieu inclut : ${place.nearbyContext.join(', ')}.
          Le quartier est : ${place.neighborhood || 'non spécifié'}.
        
          Recommande 3 établissements intéressants (priorité aux restaurants, bars, cafés et lieux touristiques) dans un rayon de 5-10 minutes à pied.
          Réponds UNIQUEMENT avec un objet JSON valide, sans formatage Markdown ni texte supplémentaire.
          
          Pour chaque lieu :
          - Fournis le nom EXACT de l'établissement tel qu'il apparaît sur Google Maps
          - Inclus une description courte et attrayante
          
          Format JSON attendu :
          {
            "topItems": [
              {
                "name": "Nom exact de l'établissement",
                "pronunciation": "Description courte et attrayante"
              }
            ],
            "dialogs": [
              {
                "prompt": "Au restaurant/café/bar",
                "messages": [
                  {
                    "speaker": "tourist",
                    "text": "Phrase utile en anglais",
                    "translation": "Traduction en français"
                  }
                ]
              }
            ]
          }` }]
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
      const recommendations = JSON.parse(recommendationsData.content[0].
      text);
  
      // Ajouter les photos pour chaque lieu
      for (const item of recommendations.topItems) {
        const photo = await getPlaceImage(item.name + " " + (place.city || place.region));
        if (photo) {
          item.image = photo;
        }
      }
  
      res.json({ ...place, ...recommendations });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  }); 