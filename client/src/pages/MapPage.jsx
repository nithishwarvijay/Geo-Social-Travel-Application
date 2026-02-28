import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
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

function toImageUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

export default function MapPage() {
  const api = useApiAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

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

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="h-[75vh]">
          <MapContainer center={[20, 0]} zoom={2} className="h-full w-full">
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution="&copy; OpenStreetMap contributors" 
            />
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