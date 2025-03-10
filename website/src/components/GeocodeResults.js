import React from 'react';

const GeocodeResults = ({ results, onSelect, onClose }) => {
  return (
    <div className="error-popup">
      <div className="error-content geocode-results">
        <button className="error-close" onClick={onClose}>×</button>
        <h3>Résultats trouvés</h3>
        <div className="geocode-list">
          {results.slice(0, 3).map((result, index) => (
            <button
              key={index}
              className="geocode-item"
              onClick={() => onSelect(result)}
            >
              <div className="geocode-name">{result.formatted_address.split(',')[0]}</div>
              <div className="geocode-address">{result.formatted_address}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeocodeResults; 