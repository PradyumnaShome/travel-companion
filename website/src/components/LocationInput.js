import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import LocationService from '../services/LocationService';
import ErrorPopup from './ErrorPopup';

const LocationInput = ({ onLocationChange, isLoading, setIsLoading, setError: setGlobalError, setStatus }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    setStatus('Recherche du lieu...');
    try {
      const placeInfo = await LocationService.getPlaceFromAddress(inputValue.trim());
      onLocationChange(placeInfo);
      setInputValue(placeInfo.address);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      const errorMessage = `Erreur de recherche : ${error.message}`;
      setError(errorMessage);
      setGlobalError(errorMessage);
      onLocationChange(null);
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setStatus('Détection de votre position...');
    try {
      const placeInfo = await LocationService.getCurrentLocation();
      onLocationChange(placeInfo);
      setInputValue(placeInfo.address);
    } catch (error) {
      setError(error.message);
      setGlobalError(error.message);
      onLocationChange(null);
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="location-input">
      <form onSubmit={handleSubmit} className="location-container">
        <MapPin className="location-icon" />
        <input
          type="text"
          placeholder="Enter an address"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="location-field"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={getCurrentLocation}
          className="location-detect-btn"
          disabled={isLoading}
          title="Detect my current location"
        >
          <Navigation />
        </button>
      </form>
      
      {error && (
        <ErrorPopup
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

export default LocationInput; 