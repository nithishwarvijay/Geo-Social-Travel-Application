import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { PenTool, MapPin, Globe, Camera, Image as ImageIcon, Send, Sparkles, Navigation } from 'lucide-react';
import MapSearchBar from '../components/MapSearchBar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApiAuth } from '../services/useApiAuth';

const customEmojiIcon = L.divIcon({
  html: '<div style="font-size: 36px; text-align: center; line-height: 1; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">📍</div>',
  className: 'custom-emoji-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const initialForm = {
  description: '',
  location_name: '',
  latitude: '',
  longitude: '',
};

function LocationMarker({ position, setPosition, setForm, onReverseGeocode }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setForm((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
      // Reverse geocode when user clicks on map
      if (onReverseGeocode) onReverseGeocode(lat, lng);
    },
  });

  return position ? <Marker position={position} icon={customEmojiIcon} /> : null;
}

// Helper to fly the map to a position programmatically
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function CreatePostPage() {
  const api = useApiAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [validating, setValidating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsActive, setGpsActive] = useState(false);

  // Reverse geocode lat/lng to a human-readable location name
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const parts = [
          addr.tourism || addr.amenity || addr.building || addr.road || addr.neighbourhood || '',
          addr.suburb || addr.city_district || addr.village || addr.town || '',
          addr.city || addr.state_district || addr.county || '',
          addr.state || '',
        ].filter(Boolean);
        const shortName = parts.slice(0, 2).join(', ') || data.display_name.split(',').slice(0, 2).join(',').trim();
        setForm((prev) => ({ ...prev, location_name: shortName }));
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Get GPS location
  const getGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const lat = parseFloat(latitude.toFixed(6));
        const lng = parseFloat(longitude.toFixed(6));

        setForm((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
        setMarkerPosition([lat, lng]);
        setFlyTarget([lat, lng]);
        setGpsActive(true);
        setGpsLoading(false);

        await reverseGeocode(lat, lng);
      },
      (err) => {
        setGpsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Location permission denied. Please allow location access in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Location information is unavailable. Please try again.');
            break;
          case err.TIMEOUT:
            setGpsError('Location request timed out. Please try again.');
            break;
          default:
            setGpsError('An unknown error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [reverseGeocode]);

  // Auto-detect GPS on page load
  useEffect(() => {
    getGPSLocation();
  }, [getGPSLocation]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'latitude' || name === 'longitude') {
      const lat = name === 'latitude' ? parseFloat(value) : parseFloat(form.latitude);
      const lng = name === 'longitude' ? parseFloat(value) : parseFloat(form.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMarkerPosition([lat, lng]);
        setFlyTarget([lat, lng]);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setAiResult(null);

    if (!image) {
      setError('Please select an image');
      return;
    }

    setSubmitting(true);
    setValidating(true);

    try {
      const payload = new FormData();
      payload.append('description', form.description.trim());
      payload.append('location_name', form.location_name.trim());
      payload.append('latitude', form.latitude);
      payload.append('longitude', form.longitude);
      payload.append('image', image);

      const response = await api.post('/api/posts', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const aiValidation = response.data?.aiValidation;
      if (aiValidation && aiValidation.verified) {
        setAiResult(aiValidation);
        setValidating(false);
        setTimeout(() => navigate('/feed'), 2500);
      } else {
        navigate('/feed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create post';
      const errorDetails = err.response?.data?.details;
      const isAiRejection = err.response?.data?.aiValidated;

      if (isAiRejection) {
        setError(`🤖 AI Detection: ${errorMessage}`);
        setAiResult({ verified: false, message: errorDetails || errorMessage, confidence: err.response?.data?.confidence });
      } else if (errorDetails) {
        setError(`${errorMessage}\n${errorDetails}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
      setValidating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="page-header">
        <h2 className="page-title">Share Your</h2>
        <h3 className="page-title-accent">ADVENTURE</h3>
        <p className="page-subtitle page-subtitle-center">
          Share your travel moments with our community and inspire others to explore the world
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <section className="create-form-section">
          {error && (
            <div className="error-alert">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label flex items-center gap-2">
                <PenTool className="w-5 h-5 text-blue-500" />
                <span>Tell us about your experience</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={1000}
                rows={4}
                className="form-input form-textarea"
                placeholder="Share your travel experience and what made it special..."
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <span>Location</span>
              </label>
              <input
                name="location_name"
                value={form.location_name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Where was this photo taken?"
              />
            </div>

            {/* GPS Button */}
            <div>
              <button
                type="button"
                onClick={getGPSLocation}
                disabled={gpsLoading}
                className="gps-btn"
              >
                {gpsLoading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: '#fff' }}></div>
                    <span>Detecting your location...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mx-1" />
                    <span>Use My Live Location</span>
                  </>
                )}
              </button>

              {/* GPS Status */}
              {gpsActive && !gpsLoading && !gpsError && (
                <div className="status-alert status-alert-success">
                  <span style={{ position: 'relative', display: 'flex', width: '12px', height: '12px' }}>
                    <span style={{
                      position: 'absolute',
                      display: 'inline-flex',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.5)',
                      animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}></span>
                    <span style={{
                      position: 'relative',
                      display: 'inline-flex',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                    }}></span>
                  </span>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    Live GPS location detected successfully!
                  </p>
                </div>
              )}

              {gpsError && (
                <div className="status-alert status-alert-warning">
                  <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{gpsError}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  <span>Latitude</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Auto-detected via GPS"
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  <span>Longitude</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Auto-detected via GPS"
                />
              </div>
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-500" />
                <span>Upload Photo</span>
              </label>
              <div className="form-file-zone group">
                <div className="flex justify-center mb-2">
                  <ImageIcon className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(event) => setImage(event.target.files?.[0] || null)}
                  style={{ fontSize: '1rem' }}
                />
                <span className="form-file-label">Choose a beautiful photo to share with the community</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="form-submit-btn"
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div className="loading-spinner" style={{ width: '24px', height: '24px', borderWidth: '2px', borderTopColor: '#fff' }}></div>
                  {validating ? 'Validating Image...' : 'Creating Post...'}
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Share Your Adventure</span>
                </div>
              )}
            </button>

            {validating && (
              <div className="status-alert status-alert-info">
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: 'var(--clr-accent)' }}></div>
                <p style={{ fontWeight: 600 }}>
                  🔍 AI is verifying image authenticity...
                </p>
              </div>
            )}

            {aiResult && aiResult.verified && (
              <div className="status-alert status-alert-ai-verified">
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>AI Verified: Image is Authentic</p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>
                    Label: {aiResult.label} • Confidence: {(aiResult.confidence * 100).toFixed(1)}%
                  </p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>Redirecting to feed...</p>
                </div>
              </div>
            )}

            {aiResult && aiResult.verified === false && (
              <div className="status-alert status-alert-ai-rejected">
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>AI Rejected: Suspicious Image</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>{aiResult.message}</p>
                  {aiResult.confidence && (
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
                      Confidence: {(aiResult.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            )}
          </form>
        </section>

        {/* Map Section */}
        <section className="create-map-section">
          <div style={{ marginBottom: '16px' }}>
            <h3 className="flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: 'var(--clr-text)', marginBottom: '8px' }}>
              <MapPin className="w-6 h-6 text-blue-500" />
              <span>Select Location on Map</span>
            </h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.95rem' }}>
              Your GPS location is auto-detected, or click the map / search to change it
            </p>
          </div>

          <div style={{ height: '600px', borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--clr-border)', position: 'relative' }}>
            <MapContainer
              center={[20, 0]}
              zoom={2}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
                maxZoom={19}
              />
              <LocationMarker
                position={markerPosition}
                setPosition={setMarkerPosition}
                setForm={setForm}
                onReverseGeocode={reverseGeocode}
              />
              <FlyToLocation position={flyTarget} />
              <MapSearchBar
                placeholder="Search location (e.g., Marina Beach, Chennai)"
                onLocationSelect={(lat, lng, displayName) => {
                  setMarkerPosition([lat, lng]);
                  setFlyTarget([lat, lng]);
                  setForm((prev) => ({
                    ...prev,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6),
                    location_name: displayName.split(',').slice(0, 2).join(',').trim(),
                  }));
                }}
              />
            </MapContainer>
          </div>

          {markerPosition && (
            <div className="status-alert status-alert-success" style={{ marginTop: '16px' }}>
              <p style={{ fontWeight: 600 }}>
                📍 Location pinned: {form.latitude}, {form.longitude}
                {form.location_name && <span style={{ fontWeight: 400, opacity: 0.8 }}> — {form.location_name}</span>}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}