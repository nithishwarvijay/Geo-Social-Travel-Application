import React, { useEffect, useState } from 'react';
import { ThumbsUp, MessageSquare } from 'lucide-react';

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
      <div className="loading-container">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="loading-text">Loading posts...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <div className="page-header-left">
            <h2 className="page-title">Community</h2>
            <h3 className="page-title-accent">FEED</h3>
            <p className="page-subtitle">Discover amazing travel stories from our community</p>
          </div>
          
          {error && (
            <div className="error-alert">
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-0 feed-container bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {posts.map((post, index) => (
              <article
                key={post.id}
                className="post-card"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {/* User Profile Header */}
                <div className="post-card-header">
                  <div className="post-avatar">
                    {post.user_email ? post.user_email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="post-user-name">
                      {post.user_email ? post.user_email.split('@')[0] : 'User'}
                    </p>
                    <p className="post-user-location">
                      <span>📍</span> {post.location_name}
                    </p>
                  </div>
                </div>
                
                <div className="post-image-wrapper">
                  <img 
                    src={toImageUrl(post.image_path)} 
                    alt={post.location_name} 
                    className="post-image" 
                    style={{ maxHeight: '560px' }} 
                  />
                </div>
                
                <div className="post-body">
                  <p className="post-description">{post.description}</p>
                  
                  {/* Like and Comment Actions */}
                  <div className="post-actions">
                    <div className="post-action-btns">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="post-action-btn group"
                      >
                        <ThumbsUp className="w-5 h-5 group-hover:scale-110 transition-transform text-blue-500" />
                        <span>{post.like_count}</span>
                      </button>
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="post-action-btn group"
                      >
                        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform text-gray-500" />
                        <span>{comments[post.id]?.length || 0}</span>
                      </button>
                    </div>
                    <button 
                      type="button" 
                      className="post-like-btn" 
                      onClick={() => handleLike(post.id)}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Like
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="comments-section">
                      {/* Add Comment */}
                      <div className="comment-input-row">
                        <input
                          type="text"
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Add a comment..."
                          className="comment-input"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="comment-post-btn"
                        >
                          Post
                        </button>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-avatar">
                              {comment.user_email ? comment.user_email.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1">
                              <p className="comment-user">
                                {comment.user_email ? comment.user_email.split('@')[0] : 'User'}
                              </p>
                              <p className="comment-text">{comment.text}</p>
                              <p className="comment-date">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {comments[post.id]?.length === 0 && (
                          <p className="text-center py-4" style={{ color: 'var(--clr-text-muted)' }}>No comments yet. Be the first to comment!</p>
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