const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY?.replace(/['"]/g, '');

if (!CLAUDE_API_KEY) {
  console.error('Erreur: REACT_APP_CLAUDE_API_KEY n\'est pas définie dans les variables d\'environnement');
}

export const getRecommendations = async (prompt) => {
  try {
    const response = await fetch('http://localhost:3001/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
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
    return data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

// Note: Pour utiliser ce service, visitez d'abord:
// https://cors-anywhere.herokuapp.com/corsdemo
// et cliquez sur le bouton pour activer l'accès temporaire

export default {
  getRecommendations
}; 