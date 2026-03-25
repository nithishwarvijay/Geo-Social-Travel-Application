import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { MapPin } from 'lucide-react';
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

const userLocationIcon = new L.DivIcon({
  className: 'custom-user-location',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <div style="position: absolute; width: 100%; height: 100%; background-color: #3b82f6; opacity: 0.25; border-radius: 50%;"></div>
      <div style="position: absolute; width: 16px; height: 16px; background-color: #3b82f6; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

function toImageUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

const createPostIcon = (imageUrl) => {
  return new L.DivIcon({
    className: 'custom-post-marker',
    html: `
      <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.25); background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;">
        <img src="${imageUrl}" alt="Post" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=100&q=80';" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -26],
  });
};

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
      <div className="page-header">
        <h2 className="page-title">Explore</h2>
        <h3 className="page-title-accent">TRAVEL MAP</h3>
        <p className="page-subtitle page-subtitle-center">
          Discover amazing places shared by our community around the world
        </p>
      </div>

      {error && (
        <div className="error-alert" style={{ maxWidth: '42rem', margin: '0 auto 1.5rem' }}>
          <p style={{ textAlign: 'center' }}>{error}</p>
        </div>
      )}

      <div className="map-container-wrapper">
        {/* Floating My Location Button */}
        <div style={{ position: 'absolute', bottom: '100px', right: '20px', zIndex: 1000 }}>
          <button
            type="button"
            onClick={() => {
              if (userLocation) {
                setFlyTarget(null);
                setTimeout(() => setFlyTarget(userLocation), 50);
              } else {
                getGPSLocation();
              }
            }}
            disabled={gpsLoading}
            className="map-location-btn"
            title="Go to my location"
          >
            {gpsLoading ? (
              <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', color: 'var(--clr-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a1 1 0 011 1v2.07A7.003 7.003 0 0118.93 11H21a1 1 0 110 2h-2.07A7.003 7.003 0 0113 18.93V21a1 1 0 11-2 0v-2.07A7.003 7.003 0 015.07 13H3a1 1 0 110-2h2.07A7.003 7.003 0 0111 5.07V3a1 1 0 011-1zm0 5a5 5 0 100 10 5 5 0 000-10zm0 3a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
            )}
            <span style={{ fontWeight: 600 }}>My Location</span>
          </button>
          {gpsError && (
            <div className="status-alert status-alert-warning" style={{ marginTop: '8px', fontSize: '0.75rem', padding: '8px 12px' }}>
              ⚠️ {gpsError}
            </div>
          )}
        </div>

        <div className="map-view">
          <MapContainer center={[20, 0]} zoom={2} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              maxZoom={19}
            />
            <MapSearchBar placeholder="Search places on the map..." />
            <FlyToLocation position={flyTarget} zoom={13} />

            {/* User's current location pin */}
            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon}>
                <Popup>
                  <div className="text-center p-1">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <p style={{ fontWeight: 700, color: 'var(--clr-accent)', fontSize: '0.875rem', margin: 0 }}>You are here</p>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', margin: 0 }}>
                      {userLocation[0]}, {userLocation[1]}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Post markers */}
            {posts.map((post) => (
              <Marker 
                key={post.id} 
                position={[Number(post.latitude), Number(post.longitude)]}
                icon={createPostIcon(toImageUrl(post.image_path))}
              >
                <Popup>
                  <div className="map-popup">
                    <img
                      src={toImageUrl(post.image_path)}
                      alt={post.location_name}
                      className="map-popup-img"
                    />
                    <div>
                      <h4 className="map-popup-title">{post.location_name}</h4>
                      <p className="map-popup-desc">{post.description}</p>
                      <div className="map-popup-footer">
                        <span className="map-popup-likes">👍 {post.like_count} likes</span>
                        <span className="map-popup-author">
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

      <div className="map-cta-section">
        <p className="map-cta-text">Want to add your location to the map?</p>
        <a href="/create" className="map-cta-btn">
          ✨ Share Your Adventure
        </a>
      </div>
    </div>
  );
}