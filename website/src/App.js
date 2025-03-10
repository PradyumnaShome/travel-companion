import './App.css';
import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import LocationInput from './components/LocationInput';
import ErrorPopup from './components/ErrorPopup';
import { FAKE_PLACES, SAMPLE_DATA } from './data/sampleData';
import { DEFAULT_IMAGES } from './utils/defaultImages';

export default function App() {
  const [places, setPlaces] = useState(FAKE_PLACES);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDialog, setSelectedDialog] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [debugPrompt, setDebugPrompt] = useState(null);
  const [localLanguage, setLocalLanguage] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('fr');

  const SUPPORTED_LANGUAGES = {
    fr: "Français",
    en: "English",
    es: "Español",
    de: "Deutsch",
    it: "Italiano"
  };

  useEffect(() => {
    const handleDebugPrompt = (event) => {
      setDebugPrompt(event.detail.message);
    };

    window.addEventListener('showDebugPrompt', handleDebugPrompt);
    return () => window.removeEventListener('showDebugPrompt', handleDebugPrompt);
  }, []);

  const handleLocationChange = async (newLocation) => {
    if (!newLocation) {
      setError('Localisation non disponible.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          address: newLocation.address,
          coords: newLocation.coords,
          targetLanguage: targetLanguage
        })
      });

      const data = await response.json();
      setLocalLanguage(data.localLanguage);
      
      const updatedPlaces = [
        {
          name: newLocation.name,
          type: 'location',
          address: newLocation.address,
          ...newLocation
        },
        ...FAKE_PLACES
      ];

      setPlaces(updatedPlaces);
      setSelectedPlace(updatedPlaces[0]);
      setPlaceDetails(data);
    } catch (err) {
      setError('Erreur lors de la récupération des données.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1>Travel Companion</h1>
        <div className="controls-section">
          <div className="language-preferences">
            <div className="language-selector">
              <label>Langue d'affichage :</label>
              <select 
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="language-select"
              >
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <LocationInput
            onLocationChange={handleLocationChange}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            setStatus={setStatus}
          />
        </div>
      </header>

      {selectedPlace && placeDetails && (
        <div className="content-wrapper">
          <div className="location-header">
            <div className="place-details">
              <div className="place-name">{selectedPlace.name}</div>
              <div className="place-address">{selectedPlace.address}</div>
            </div>
            
            <div className="languages-info">
              <div className="language-row display-language">
                <span className="language-label">Langue d'affichage :</span>
                <span className="language-name">{SUPPORTED_LANGUAGES[targetLanguage]}</span>
              </div>
              
              {placeDetails.localLanguage && (
                <div className="language-row local-language">
                  <span className="language-label">Langue locale :</span>
                  <span className="language-name">{placeDetails.localLanguage.name}</span>
                  <span className="native-name">({placeDetails.localLanguage.nativeName})</span>
                </div>
              )}
            </div>
          </div>

          <div className="main-content">
            <div className="dialogs-section">
              <h2 className="section-title">Dialogues courants</h2>
              {selectedDialog ? (
                <div className="chat-container">
                  <button className="back-button" onClick={() => setSelectedDialog(null)}>
                    ← Retour aux dialogues
                  </button>
                  {selectedDialog.messages.map((msg, index) => (
                    <div key={index} className={`chat-bubble ${msg.speaker}`}>
                      <div className="message-text">{msg.text}</div>
                      <div className="translation">{msg.translation}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dialog-buttons">
                  {placeDetails.dialogs?.map((dialog, index) => (
                    <button key={index} onClick={() => setSelectedDialog(dialog)}>
                      {dialog.prompt} <ArrowRight />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="places-section">
              <h2 className="section-title">Lieux à proximité</h2>
              <div className="items-grid">
                {placeDetails.topItems?.map((item, index) => (
                  <div key={index} className="item-card">
                    <img 
                      src={item.image || DEFAULT_IMAGES[item.type] || DEFAULT_IMAGES.default} 
                      alt={item.name} 
                      className="item-image"
                      onError={(e) => {
                        e.target.src = DEFAULT_IMAGES.default;
                      }}
                    />
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-description">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(error || debugPrompt) && (
        <ErrorPopup
          message={debugPrompt || error}
          onClose={() => {
            setError(null);
            setDebugPrompt(null);
          }}
        />
      )}
    </div>
  );
}
