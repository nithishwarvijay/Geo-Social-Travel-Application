import React, { useEffect, useState } from 'react';

import { useApiAuth } from '../services/useApiAuth';

export default function AdminDashboard() {
  const api = useApiAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/api/posts');
        setPosts(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin posts');
      }
    };

    fetchPosts();
  }, [api]);

  const removePost = async (id) => {
    setError('');
    try {
      await api.delete(`/api/admin/posts/${id}`);
      setPosts((prev) => prev.filter((post) => post.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Admin</h2>
        <h3 className="text-4xl font-bold text-red-600 mb-4">DASHBOARD</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage community posts and maintain platform quality
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 max-w-2xl mx-auto">
          <p className="text-red-700 font-medium text-center">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <h4 className="text-white text-xl font-bold">Posts Management</h4>
          <p className="text-red-100">Total Posts: {posts.length}</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="flex items-start justify-between rounded-xl border-2 border-gray-200 bg-gray-50 p-6 hover:border-red-300 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
                      {post.user_email ? post.user_email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {post.user_email ? post.user_email.split('@')[0] : 'User'}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span>📍</span> {post.location_name}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-3">{post.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="text-red-600">❤️</span>
                      {post.like_count} likes
                    </span>
                    <span>ID: {post.id}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="ml-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  onClick={() => removePost(post.id)}
                >
                  Delete Post
                </button>
              </article>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Posts Yet</h3>
                <p className="text-gray-600">Posts will appear here when users start sharing their adventures.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}