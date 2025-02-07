import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useLoadScript } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = "AIzaSyBLSAPqtZQ4KhCTNP9zkM2Dke9giqwhENc";

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 20.5937, // Default center at India
  lng: 78.9629
};

const libraries = ["places"];

const LocationPicker = ({ value, onChange }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(
    value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : defaultCenter
  );
  const [marker, setMarker] = useState(
    value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : null
  );
  const [searchInput, setSearchInput] = useState(value?.address || '');
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (!value?.lat && !value?.lng && isLoaded) {
      getCurrentLocation();
    }
  }, [isLoaded]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationError('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setCenter(currentLocation);
          setMarker(currentLocation);
          
          // Get address from coordinates
          getAddressFromLatLng(currentLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError('Could not get your current location. Please search or select manually.');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  };

  const getAddressFromLatLng = async (latLng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: latLng });
      if (result.results[0]) {
        const address = result.results[0].formatted_address;
        setSearchInput(address);
        onChange({
          ...latLng,
          address
        });
        if (map) {
          map.panTo(latLng);
          map.setZoom(15);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError('Error getting address');
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
    // Search after user stops typing for 500ms
    debounceSearch(e.target.value);
  };

  const debounceSearch = useCallback(
    debounce((inputValue) => {
      if (!inputValue) return;

      getAddressFromLatLng({
        lat: center.lat,
        lng: center.lng
      });
    }, 500),
    [center, getAddressFromLatLng]
  );

  const handleMapClick = useCallback((e) => {
    const latLng = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setMarker(latLng);
    getAddressFromLatLng(latLng);
  }, []);

  const handleMarkerDrag = (event) => {
    const newLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    setMarker(newLocation);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: newLocation }, (results, status) => {
      if (status === "OK" && results[0]) {
        setSearchInput(results[0].formatted_address);
        onChange({
          ...newLocation,
          address: results[0].formatted_address
        });
      }
    });
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.searchContainer}>
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchInputChange}
          placeholder="Search for a location"
          style={styles.searchInput}
        />
        <button 
          onClick={getCurrentLocation}
          style={styles.locationButton}
          title="Use current location"
        >
          📍
        </button>
      </div>
      {locationError && (
        <div style={styles.errorMessage}>{locationError}</div>
      )}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={marker ? 15 : 5}
        onLoad={map => setMap(map)}
        onClick={handleMapClick}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true
        }}
      >
        {marker && (
          <Marker
            position={marker}
            draggable={true}
            onDragEnd={handleMarkerDrag}
          />
        )}
      </GoogleMap>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    '&:focus': {
      outline: 'none',
      borderColor: '#3949ab',
      boxShadow: '0 0 0 2px rgba(57, 73, 171, 0.1)'
    }
  },
  locationButton: {
    padding: '12px',
    fontSize: '20px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      borderColor: '#3949ab'
    }
  },
  errorMessage: {
    color: '#d32f2f',
    padding: '8px',
    fontSize: '12px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    marginBottom: '8px'
  }
};

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default LocationPicker; 