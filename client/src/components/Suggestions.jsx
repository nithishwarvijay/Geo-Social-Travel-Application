import { Link } from 'react-router-dom';

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
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-6">Suggested for you</h3>
        <div className="space-y-4">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {user.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  <p className="text-xs text-gray-400">{user.mutualFriends} mutual friends</p>
                </div>
              </div>
              <button
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
                  user.isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg'
                }`}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
        <Link to="/explore" className="block text-center text-red-600 hover:text-red-700 font-semibold mt-6 py-2 rounded-full hover:bg-red-50 transition-colors">
          See all suggestions
        </Link>
      </div>

      {/* Trending Places */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-6">Trending Places</h3>
        <div className="space-y-4">
          {trendingPlaces.map((place, index) => (
            <div key={index} className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-colors">
              <img
                src={place.image}
                alt={place.name}
                className="h-14 w-14 rounded-xl object-cover shadow-md"
              />
              <div>
                <p className="font-bold text-gray-900">{place.name}</p>
                <p className="text-sm text-gray-500">{place.posts.toLocaleString()} posts</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/explore" className="block text-center text-red-600 hover:text-red-700 font-semibold mt-6 py-2 rounded-full hover:bg-red-50 transition-colors">
          Explore more places
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-6">Quick Actions</h3>
        <div className="space-y-3">
          <Link
            to="/create"
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-300 group"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white text-xl">📸</span>
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-red-600">Share a moment</span>
          </Link>
          <Link
            to="/map"
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-300 group"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white text-xl">🗺️</span>
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-red-600">Explore map</span>
          </Link>
        </div>
      </div>
    </div>
  );
}