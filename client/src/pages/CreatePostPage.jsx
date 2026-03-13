import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import MapSearchBar from '../components/MapSearchBar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useApiAuth } from '../services/useApiAuth';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
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

  return position ? <Marker position={position} /> : null;
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
        // Extract a short, meaningful name
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
      // Silently fail — user can still type the name manually
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

        // Reverse geocode to get location name
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

    // Update marker position if latitude or longitude changes manually
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

      // Show AI validation result before navigating
      const aiValidation = response.data?.aiValidation;
      if (aiValidation && aiValidation.verified) {
        setAiResult(aiValidation);
        setValidating(false);
        // Wait 2.5s to show the AI result, then navigate
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
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Share Your</h2>
        <h3 className="text-4xl font-bold text-red-600 mb-4">ADVENTURE</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Share your travel moments with our community and inspire others to explore the world
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <section className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">
                Tell us about your experience
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={1000}
                rows={4}
                className="w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Share your travel experience and what made it special..."
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">
                Location
              </label>
              <input
                name="location_name"
                value={form.location_name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Where was this photo taken?"
              />
            </div>

            {/* GPS / Use My Location Button */}
            <div>
              <button
                type="button"
                onClick={getGPSLocation}
                disabled={gpsLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {gpsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Detecting your location...</span>
                  </>
                ) : (
                  <>
                    {/* GPS Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a1 1 0 011 1v2.07A7.003 7.003 0 0118.93 11H21a1 1 0 110 2h-2.07A7.003 7.003 0 0113 18.93V21a1 1 0 11-2 0v-2.07A7.003 7.003 0 015.07 13H3a1 1 0 110-2h2.07A7.003 7.003 0 0111 5.07V3a1 1 0 011-1zm0 5a5 5 0 100 10 5 5 0 000-10zm0 3a2 2 0 110 4 2 2 0 010-4z" />
                    </svg>
                    <span>📍 Use My Live Location</span>
                  </>
                )}
              </button>

              {/* GPS Status Messages */}
              {gpsActive && !gpsLoading && !gpsError && (
                <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <p className="text-green-700 font-medium text-sm">
                    Live GPS location detected successfully!
                  </p>
                </div>
              )}

              {gpsError && (
                <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <p className="text-amber-700 font-medium text-sm">{gpsError}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-3">
                  Latitude
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
                  className="w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:border-red-500 focus:outline-none transition-colors bg-gray-50"
                  placeholder="Auto-detected via GPS"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-900 mb-3">
                  Longitude
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
                  className="w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:border-red-500 focus:outline-none transition-colors bg-gray-50"
                  placeholder="Auto-detected via GPS"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">
                Upload Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(event) => setImage(event.target.files?.[0] || null)}
                  className="w-full text-lg"
                />
                <p className="text-gray-500 mt-2">Choose a beautiful photo to share with the community</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  {validating ? 'Validating Image...' : 'Creating Post...'}
                </span>
              ) : (
                'Share Your Adventure'
              )}
            </button>

            {validating && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-blue-800 font-medium">
                    🔍 AI is verifying image authenticity...
                  </p>
                </div>
              </div>
            )}

            {aiResult && aiResult.verified && (
              <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl animate-pulse">
                <div className="flex items-center gap-3 justify-center">
                  <span className="text-2xl">✅</span>
                  <div className="text-center">
                    <p className="text-green-800 font-bold text-lg">AI Verified: Image is Authentic</p>
                    <p className="text-green-600 text-sm">
                      Label: {aiResult.label} • Confidence: {(aiResult.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-green-500 text-xs mt-1">Redirecting to feed...</p>
                  </div>
                </div>
              </div>
            )}

            {aiResult && aiResult.verified === false && (
              <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-xl">
                <div className="flex items-center gap-3 justify-center">
                  <span className="text-2xl">🤖</span>
                  <div className="text-center">
                    <p className="text-red-800 font-bold text-lg">AI Rejected: Suspicious Image</p>
                    <p className="text-red-600 text-sm">{aiResult.message}</p>
                    {aiResult.confidence && (
                      <p className="text-red-500 text-xs mt-1">
                        Confidence: {(aiResult.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </section>

        {/* Map Section */}
        <section className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Location on Map</h3>
            <p className="text-gray-600">Your GPS location is auto-detected, or click the map / search to change it</p>
          </div>

          <div className="h-[600px] rounded-xl overflow-hidden border-2 border-gray-200" style={{ position: 'relative' }}>
            <MapContainer
              center={[20, 0]}
              zoom={2}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
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
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 font-semibold">
                📍 Location pinned: {form.latitude}, {form.longitude}
                {form.location_name && <span className="text-green-600 font-normal"> — {form.location_name}</span>}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}