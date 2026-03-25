import { Link } from 'react-router-dom';
import { Users, Flame, Zap, Camera, Map } from 'lucide-react';

export default function Suggestions() {
  const suggestions = [
    {
      id: 1,
      name: "Alex Johnson",
      username: "alexj_travels",
      avatar: "A",
      isFollowing: false,
      mutualFriends: 3
    },
    {
      id: 2,
      name: "Maria Garcia",
      username: "maria_explorer",
      avatar: "M",
      isFollowing: false,
      mutualFriends: 7
    },
    {
      id: 3,
      name: "David Chen",
      username: "david_wanderer",
      avatar: "D",
      isFollowing: true,
      mutualFriends: 12
    },
    {
      id: 4,
      name: "Sarah Wilson",
      username: "sarah_adventures",
      avatar: "S",
      isFollowing: false,
      mutualFriends: 5
    }
  ];

  const trendingPlaces = [
    {
      name: "Santorini, Greece",
      posts: 1234,
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "Bali, Indonesia", 
      posts: 987,
      image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "Tokyo, Japan",
      posts: 756,
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Suggested Users */}
      <div className="sidebar-card" style={{ animationDelay: '0.1s' }}>
        <h3 className="sidebar-title">
          <span className="sidebar-title-icon"><Users className="w-5 h-5 text-blue-500" /></span>
          Suggested for you
        </h3>
        <div className="space-y-3">
          {suggestions.map((user) => (
            <div key={user.id} className="suggestion-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="suggestion-avatar">
                  {user.avatar}
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clr-text)', fontSize: '0.9rem' }}>{user.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>@{user.username}</p>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{user.mutualFriends} mutual friends</p>
                </div>
              </div>
              <button
                className={`follow-btn ${
                  user.isFollowing ? 'follow-btn-secondary' : 'follow-btn-primary'
                }`}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
        <Link to="/explore" className="sidebar-link">
          See all suggestions →
        </Link>
      </div>

      {/* Trending Places */}
      <div className="sidebar-card" style={{ animationDelay: '0.2s' }}>
        <h3 className="sidebar-title">
          <span className="sidebar-title-icon"><Flame className="w-5 h-5 text-orange-500" /></span>
          Trending Places
        </h3>
        <div className="space-y-2">
          {trendingPlaces.map((place, index) => (
            <div key={index} className="trending-item">
              <img
                src={place.image}
                alt={place.name}
                className="trending-img"
              />
              <div>
                <p style={{ fontWeight: 700, color: 'var(--clr-text)', fontSize: '0.9rem' }}>{place.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{place.posts.toLocaleString()} posts</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/explore" className="sidebar-link">
          Explore more places →
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="sidebar-card" style={{ animationDelay: '0.3s' }}>
        <h3 className="sidebar-title">
          <span className="sidebar-title-icon"><Zap className="w-5 h-5 text-yellow-500" /></span>
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Link to="/create" className="quick-action">
            <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
              <span style={{ color: '#fff' }}><Camera className="w-5 h-5" /></span>
            </div>
            <span className="quick-action-label">Share a moment</span>
          </Link>
          <Link to="/map" className="quick-action">
            <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, var(--clr-accent), #7c3aed)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
              <span style={{ color: '#fff' }}><Map className="w-5 h-5" /></span>
            </div>
            <span className="quick-action-label">Explore map</span>
          </Link>
        </div>
      </div>
    </div>
  );
}