import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const disableClerk = String(import.meta.env.VITE_DISABLE_CLERK || '').toLowerCase() === 'true';
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    joinedDate: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);

  const handleChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    setProfile(editForm);
    localStorage.setItem('userProfile', JSON.stringify(editForm));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      setEditForm(parsed);
    } else {
      // Default profile if no saved data
      const defaultProfile = {
        name: 'Travel Enthusiast',
        email: 'user@example.com',
        bio: 'Love exploring new places and sharing my adventures!',
        location: 'Worldwide',
        joinedDate: 'February 2026'
      };
      setProfile(defaultProfile);
      setEditForm(defaultProfile);
    }
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cover Photo */}
        <div className="h-72 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 relative">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-30"></div>
        </div>
        
        {/* Profile Info */}
        <div className="px-8 pb-8 relative">
          {/* Avatar and Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-24 mb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6 mb-4 md:mb-0">
              <div className="h-48 w-48 rounded-full border-8 border-white bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-7xl font-bold text-white shadow-2xl">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="mb-4">
                <h1 className="text-5xl font-bold text-gray-900 mb-2">{profile.name || 'User'}</h1>
                <p className="text-xl text-gray-600 flex items-center gap-2">
                  <span>✉️</span> {profile.email || 'user@example.com'}
                </p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="self-start md:self-auto mb-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="mt-8 space-y-6 border-t-2 border-gray-100 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
                  placeholder="Where are you from?"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-full font-semibold transition-colors"
                >
                  ✖️ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-8 border-t-2 border-gray-100 pt-8">
              {/* Bio Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white">
                    📝
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">About Me</h3>
                </div>
                <p className="text-lg text-gray-800 leading-relaxed pl-13">
                  {profile.bio || 'No bio added yet.'}
                </p>
              </div>
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">
                      📍
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Location</h3>
                  </div>
                  <p className="text-xl text-gray-800 font-semibold pl-15">
                    {profile.location || 'Not specified'}
                  </p>
                </div>
                
                {/* Joined Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-2xl shadow-lg">
                      📅
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Member Since</h3>
                  </div>
                  <p className="text-xl text-gray-800 font-semibold pl-15">
                    {profile.joinedDate || 'Recently'}
                  </p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
                  <div className="text-sm text-gray-600 font-semibold uppercase">Posts</div>
                </div>
                <div className="text-center border-x-2 border-gray-300">
                  <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
                  <div className="text-sm text-gray-600 font-semibold uppercase">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
                  <div className="text-sm text-gray-600 font-semibold uppercase">Following</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
