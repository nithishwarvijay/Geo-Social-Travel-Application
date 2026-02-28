import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApiAuth } from '../services/useApiAuth';

const initialForm = {
  description: '',
  location_name: '',
  latitude: '',
  longitude: '',
};

export default function CreatePostPage() {
  const api = useApiAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!image) {
      setError('Please select an image');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('description', form.description.trim());
      payload.append('location_name', form.location_name.trim());
      payload.append('latitude', form.latitude);
      payload.append('longitude', form.longitude);
      payload.append('image', image);

      await api.post('/api/posts', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Share Your</h2>
        <h3 className="text-4xl font-bold text-red-600 mb-4">ADVENTURE</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Share your travel moments with our community and inspire others to explore the world
        </p>
      </div>

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
                className="w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="e.g., 40.7128"
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
                className="w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="e.g., -74.0060"
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
                Creating Post...
              </span>
            ) : (
              'Share Your Adventure'
            )}
          </button>
        </form>
      </section>
    </div>
  );
}