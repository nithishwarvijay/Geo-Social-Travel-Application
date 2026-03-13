import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapSearchBar from '../components/MapSearchBar';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useApiAuth } from '../services/useApiAuth';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function toImageUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

// Flies the map to a given position
function FlyToLocation({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 13, { duration: 1.8 });
    }
  }, [position, zoom, map]);
  return null;
}

export default function MapPage() {
  const api = useApiAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/api/posts');
        setPosts(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load map posts');
      }
    };

    fetchPosts();
  }, [api]);

  // Get user GPS location
  const getGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const loc = [parseFloat(latitude.toFixed(6)), parseFloat(longitude.toFixed(6))];
        setUserLocation(loc);
        setFlyTarget(loc);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Location access denied.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Location unavailable.');
            break;
          case err.TIMEOUT:
            setGpsError('Location request timed out.');
            break;
          default:
            setGpsError('Could not get location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // Auto-detect GPS on page load
  useEffect(() => {
    getGPSLocation();
  }, [getGPSLocation]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Explore</h2>
        <h3 className="text-4xl font-bold text-red-600 mb-4">TRAVEL MAP</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover amazing places shared by our community around the world
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 max-w-2xl mx-auto">
          <p className="text-red-700 font-medium text-center">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">
        {/* Floating My Location Button */}
        <div style={{ position: 'absolute', bottom: '100px', right: '20px', zIndex: 1000 }}>
          <button
            type="button"
            onClick={() => {
              if (userLocation) {
                setFlyTarget(null);
                // Small delay to re-trigger flyTo even if location hasn't changed
                setTimeout(() => setFlyTarget(userLocation), 50);
              } else {
                getGPSLocation();
              }
            }}
            disabled={gpsLoading}
            className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-semibold text-sm transition-all duration-300 hover:scale-105 disabled:opacity-60 bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
            title="Go to my location"
          >
            {gpsLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a1 1 0 011 1v2.07A7.003 7.003 0 0118.93 11H21a1 1 0 110 2h-2.07A7.003 7.003 0 0113 18.93V21a1 1 0 11-2 0v-2.07A7.003 7.003 0 015.07 13H3a1 1 0 110-2h2.07A7.003 7.003 0 0111 5.07V3a1 1 0 011-1zm0 5a5 5 0 100 10 5 5 0 000-10zm0 3a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
            )}
            <span>My Location</span>
          </button>
          {gpsError && (
            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 shadow">
              ⚠️ {gpsError}
            </div>
          )}
        </div>

        <div className="h-[75vh]">
          <MapContainer center={[20, 0]} zoom={2} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <MapSearchBar placeholder="Search places on the map..." />
            <FlyToLocation position={flyTarget} zoom={13} />

            {/* User's current location — pulsing blue dot */}
            {userLocation && (
              <>
                {/* Outer glow ring */}
                <CircleMarker
                  center={userLocation}
                  radius={20}
                  pathOptions={{
                    color: 'rgba(59, 130, 246, 0.3)',
                    fillColor: 'rgba(59, 130, 246, 0.1)',
                    fillOpacity: 0.3,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <p className="font-bold text-blue-700 text-sm">📍 You are here</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {userLocation[0]}, {userLocation[1]}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
                {/* Inner solid dot */}
                <CircleMarker
                  center={userLocation}
                  radius={7}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    weight: 3,
                  }}
                />
              </>
            )}

            {/* Post markers */}
            {posts.map((post) => (
              <Marker key={post.id} position={[Number(post.latitude), Number(post.longitude)]}>
                <Popup>
                  <div className="w-64 space-y-3">
                    <img
                      src={toImageUrl(post.image_path)}
                      alt={post.location_name}
                      className="h-32 w-full rounded-lg object-cover shadow-md"
                    />
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-lg">{post.location_name}</h4>
                      <p className="text-gray-700">{post.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-red-600 font-semibold">❤️ {post.like_count} likes</span>
                        <span className="text-sm text-gray-500">
                          by {post.user_email ? post.user_email.split('@')[0] : 'User'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">Want to add your location to the map?</p>
        <a
          href="/create"
          className="inline-block bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Share Your Adventure
        </a>
      </div>
    </div>
  );
}