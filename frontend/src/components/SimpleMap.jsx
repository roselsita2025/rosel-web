import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SimpleMap = ({ className = "" }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [pinLocation, setPinLocation] = useState({
    lat: 14.4500,
    lng: 120.9833,
    address: 'Las Piñas, Metro Manila, Philippines'
  });

  // Fetch pickup coordinates from backend
  useEffect(() => {
    const fetchPickupCoordinates = async () => {
      try {
        const response = await axios.get(`${API_URL}/contact/info`);
        if (response.data.success) {
          // SimpleMap fetched coordinates
          setPinLocation({
            lat: response.data.data.lat,
            lng: response.data.data.lng,
            address: response.data.data.address
          });
        }
      } catch (error) {
        console.error('Failed to load pickup coordinates:', error);
        // Keep default coordinates if API fails
      }
    };

    fetchPickupCoordinates();
  }, []);

  useEffect(() => {
    if (pinLocation.lat && pinLocation.lng && pinLocation.lat !== 14.4500) {
      // Initializing map with fetched coordinates
      initializeMap();
    }
  }, [pinLocation]);

  const initializeMap = () => {
    // SimpleMap initializeMap called
    
    if (window.google && window.google.maps && window.google.maps.Map) {
      const mapElement = document.getElementById('simple-map');
      // Map element found
      
      if (mapElement && !map) {
        // Creating simple Google Map
        
        const googleMap = new window.google.maps.Map(mapElement, {
          center: pinLocation,
          zoom: 15,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        });

        // Add marker at the pin location
        const googleMarker = new window.google.maps.Marker({
          position: pinLocation,
          map: googleMap,
          title: 'Rosel Meat Store',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#860809" stroke="#fff" stroke-width="2"/>
                <path d="M20 8c-4.4 0-8 3.6-8 8 0 6 8 16 8 16s8-10 8-16c0-4.4-3.6-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" fill="#fff"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          }
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #860809; font-size: 16px; font-weight: bold;">
                Rosel Meat Store
              </h3>
              <p style="margin: 0; color: #030105; font-size: 14px; line-height: 1.4;">
                ${pinLocation.address}
              </p>
              <p style="margin: 8px 0 0 0; color: #82695b; font-size: 12px;">
                Click for directions
              </p>
            </div>
          `
        });

        // Add click event to marker
        googleMarker.addListener('click', () => {
          infoWindow.open(googleMap, googleMarker);
        });

        // Add click event to map
        googleMap.addListener('click', () => {
          infoWindow.close();
        });

        setMap(googleMap);
        setMarker(googleMarker);
        setMapLoaded(true);
        // Reset retry counter on success
        window._mapRetryCount = 0;
        // Simple Google Map with pin initialized successfully
      }
    } else if (window.google && window.google.maps && !window.google.maps.Map) {
      // API is loaded but Map constructor is not available yet
      // Google Maps API loaded but Map constructor not ready, retrying
      // Add a retry counter to prevent infinite retries
      if (!window._mapRetryCount) {
        window._mapRetryCount = 0;
      }
      if (window._mapRetryCount < 50) { // 5 seconds max
        window._mapRetryCount++;
        setTimeout(initializeMap, 100);
      } else {
        console.error('Map constructor not available after maximum retries');
        setMapError('Google Maps API not fully loaded');
      }
    } else {
      // Load Google Maps script if not already loaded
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const apiKey = import.meta.env.VITE_MAPS_PLATFORM_API_KEY;
        // Google Maps API Key loaded
        
        if (!apiKey) {
          console.error('VITE_MAPS_PLATFORM_API_KEY is not defined in environment variables');
          setMapError('Google Maps API key not configured');
          return;
        }
        
        // Loading Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          // Google Maps script loaded, initializing simple map
          setTimeout(initializeMap, 100);
        };
        script.onerror = () => {
          console.error('Failed to load Google Maps script');
          setMapError('Failed to load Google Maps');
        };
        document.head.appendChild(script);
      } else {
        // Google Maps script already loaded, retrying initialization
        setTimeout(initializeMap, 100);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {mapError ? (
        <div className="w-full h-full flex items-center justify-center bg-[#fef2f2] rounded-lg">
          <div className="text-center p-8">
            <MapPin className="w-16 h-16 text-[#ef4444] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#ef4444] mb-2">Map Unavailable</h3>
            <p className="text-sm font-medium text-[#ef4444] mb-2">
              {mapError}
            </p>
            <p className="text-xs text-[#dc2626]">
              Map temporarily unavailable. Please try again later.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <div 
            id="simple-map"
            className="w-full h-full rounded-lg"
            style={{ minHeight: '400px' }}
          />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f8f3ed] rounded-lg">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-[#a31f17] mx-auto mb-2" />
                <p className="text-sm text-[#a31f17]">
                  Loading Google Maps...
                </p>
                <p className="text-xs mt-1 text-[#860809]">
                  Please wait...
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleMap;
