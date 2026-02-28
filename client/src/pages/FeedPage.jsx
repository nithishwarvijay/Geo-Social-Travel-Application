import React, { useEffect, useState } from 'react';

import { useApiAuth } from '../services/useApiAuth';
import Suggestions from '../components/Suggestions';

function toImageUrl(path) {
  if (!path) return '';
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

export default function FeedPage() {
  const api = useApiAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/api/posts');
        setPosts(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [api]);

  const handleLike = async (id) => {
    try {
      const { data } = await api.post(`/api/posts/like/${id}`);
      if (data.message === 'Liked post') {
        setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, like_count: post.like_count + 1 } : post)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to like post');
    }
  };

  const fetchComments = async (postId) => {
    try {
      const { data } = await api.get(`/api/posts/${postId}/comments`);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  const toggleComments = async (postId) => {
    const isShowing = showComments[postId];
    setShowComments((prev) => ({ ...prev, [postId]: !isShowing }));
    
    if (!isShowing && !comments[postId]) {
      await fetchComments(postId);
    }
  };

  const handleAddComment = async (postId) => {
    const text = newComment[postId];
    if (!text || text.trim().length === 0) return;

    try {
      const { data } = await api.post(`/api/posts/${postId}/comments`, { text: text.trim() });
      setComments((prev) => ({
        ...prev,
        [postId]: [data, ...(prev[postId] || [])],
      }));
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  if (loading) return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Community</h2>
            <h3 className="text-4xl font-bold text-red-600 mb-4">FEED</h3>
            <p className="text-gray-600">Discover amazing travel stories from our community</p>
          </div>
          
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                {/* User Profile Header */}
                <div className="flex items-center gap-4 p-6 pb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {post.user_email ? post.user_email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {post.user_email ? post.user_email.split('@')[0] : 'User'}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <span>📍</span> {post.location_name}
                    </p>
                  </div>
                </div>
                
                <img 
                  src={toImageUrl(post.image_path)} 
                  alt={post.location_name} 
                  className="w-full object-cover hover:scale-105 transition-transform duration-500" 
                  style={{ maxHeight: '600px' }} 
                />
                
                <div className="p-6">
                  <p className="text-gray-800 text-lg leading-relaxed mb-4">{post.description}</p>
                  
                  {/* Like and Comment Actions */}
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4 mb-4">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <span className="text-2xl">❤️</span>
                        <span className="font-semibold">{post.like_count}</span>
                      </button>
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-2xl">💬</span>
                        <span className="font-semibold">{comments[post.id]?.length || 0}</span>
                      </button>
                    </div>
                    <button 
                      type="button" 
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg" 
                      onClick={() => handleLike(post.id)}
                    >
                      Like
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="border-t border-gray-200 pt-4">
                      {/* Add Comment */}
                      <div className="flex gap-3 mb-4">
                        <input
                          type="text"
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Add a comment..."
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-full focus:border-red-500 focus:outline-none transition-colors"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300"
                        >
                          Post
                        </button>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="flex gap-3 bg-gray-50 rounded-xl p-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {comment.user_email ? comment.user_email.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-sm">
                                {comment.user_email ? comment.user_email.split('@')[0] : 'User'}
                              </p>
                              <p className="text-gray-800 mt-1">{comment.text}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {comments[post.id]?.length === 0 && (
                          <p className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar with Suggestions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Suggestions />
          </div>
        </div>
      </div>
    </div>
  );
}