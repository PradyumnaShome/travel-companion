import './App.css';
import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import LocationInput from './components/LocationInput';
import ErrorPopup from './components/ErrorPopup';
import { FAKE_PLACES, SAMPLE_DATA } from './data/sampleData';

export default function App() {
  const [places, setPlaces] = useState(FAKE_PLACES);
  const [selectedPlace, setSelectedPlace] = useState(FAKE_PLACES[0]);
  const [selectedDialog, setSelectedDialog] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(SAMPLE_DATA[FAKE_PLACES[0].type][FAKE_PLACES[0].language]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [debugPrompt, setDebugPrompt] = useState(null);

  useEffect(() => {
    const handleDebugPrompt = (event) => {
      setDebugPrompt(event.detail.message);
    };

    window.addEventListener('showDebugPrompt', handleDebugPrompt);
    return () => window.removeEventListener('showDebugPrompt', handleDebugPrompt);
  }, []);

  const handleLocationChange = async (newLocation) => {
    if (!newLocation) {
      setError('Localisation non disponible. Affichage des lieux exemple.');
      return;
    }

    // Ajouter le nouveau lieu à la liste
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
    setPlaceDetails(newLocation);
  };

  return (
    <div className="container">
      <h1>Travel Companion</h1>
      
      {status && <div className="status-message">{status}</div>}
      
      <LocationInput
        onLocationChange={handleLocationChange}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setError={setError}
        setStatus={setStatus}
      />
      
      <select
        value={selectedPlace?.name || ''}
        onChange={(e) => {
          const place = places.find(p => p.name === e.target.value);
          setSelectedPlace(place);
          setPlaceDetails(place.type === 'location' ? place : SAMPLE_DATA[place.type][place.language]);
        }}
        disabled={isLoading}
      >
        <option value="">Sélectionnez un lieu</option>
        {places.map((place, index) => (
          <option key={index} value={place.name}>
            {place.name}
            {place.type !== 'location' && ` - ${place.type.charAt(0).toUpperCase() + place.type.slice(1)} (Exemple)`}
          </option>
        ))}
      </select>

      {selectedPlace && placeDetails && (
        <>
          <div className="place-info">
            <div className="place-name">{selectedPlace.name}</div>
            <div className="place-address">{selectedPlace.address}</div>
          </div>

          <div className="items-grid">
            {placeDetails.topItems?.map((item, index) => (
              <div key={index} className="item-card">
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-name">{item.name}</div>
                <div className="item-pronunciation">{item.pronunciation}</div>
              </div>
            ))}
          </div>

          <div className="dialogs-container">
            <h2 className="dialog-title">Dialogues courants</h2>
            {selectedDialog ? (
              <div className="chat-container">
                <button onClick={() => setSelectedDialog(null)}>
                  ← Retour aux dialogues
                </button>
                {selectedDialog.messages.map((msg, index) => (
                  <div key={index} className={`chat-bubble ${msg.speaker}`}>
                    <div>{msg.text}</div>
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
        </>
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
