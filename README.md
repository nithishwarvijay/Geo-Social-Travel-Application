# Geo Social Travel Application

A modern, full-stack social media platform for travelers to share their adventures, discover new destinations, and connect with fellow explorers around the world.

## 🌟 Features

### User Features
- **Beautiful Landing Page**: Stunning hero section with slideshow and destination highlights
- **User Authentication**: Secure login and signup system
- **User Profiles**: Customizable profiles with bio, location, and avatar
- **Community Feed**: Share and discover travel posts from the community
- **Interactive Map**: Explore posts on an interactive world map with click-to-select location
- **Comments & Likes**: Engage with posts through comments and likes
- **Create Posts**: Share your travel moments with photos and location data
- **AI Image Validation**: Deepfake detection to ensure authentic travel photos
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Admin Features
- **Admin Dashboard**: Manage and moderate community posts
- **Post Management**: Delete inappropriate content

### AI Features
- **Deepfake Detection**: Automatically validates uploaded images using Vision Transformer (ViT)
- **Real-time Validation**: Images are checked before post creation
- **Confidence Scoring**: Shows detection confidence level
- **Automatic Rejection**: Fake or AI-generated images are automatically rejected

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Leaflet** - Interactive maps
- **Clerk** - Authentication (optional)

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL** - Database (with JSON fallback)
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.8+ (for AI image validation)
- MySQL (optional - uses JSON file storage as fallback)

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/nithishwarvijay/Geo-Social-Travel-Application.git
cd Geo-Social-Travel-Application
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 4. Setup AI Service (Deepfake Detection)

#### On Windows:
```bash
cd ../server/ai-service
setup.bat
```

#### On Linux/Mac:
```bash
cd ../server/ai-service
chmod +x setup.sh
./setup.sh
```

Or manually:
```bash
cd server/ai-service
pip install -r requirements.txt
```

**Note**: The AI model (~350MB) will be downloaded automatically on first use.

### 4. Configure Environment Variables

#### Backend (.env)
Create a `server/.env` file:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=geo_social

DEV_BYPASS_AUTH=true
DEV_USER_ID=dev_admin_1
DEV_USER_EMAIL=devadmin@example.com

CLERK_SECRET_KEY=your_clerk_secret_key
```

#### Frontend (.env)
Create a `client/.env` file:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_DISABLE_CLERK=true
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## 🏃 Running the Application

### Start Backend Server
```bash
cd server
npm run dev
```
Server will run on http://localhost:5000

### Start Frontend Client
```bash
cd client
npm run dev
```
Client will run on http://localhost:3000

## 📁 Project Structure

```
Geo-Social-Travel-Application/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── routes/        # Route guards
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
│
├── server/                # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── data/            # JSON data storage
│   ├── middleware/      # Custom middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── uploads/         # Uploaded images
│   └── package.json
│
└── README.md
```

## 🎨 Key Features Explained

### Landing Page
- Hero section with auto-rotating slideshow
- Featured destinations with pricing
- Feature highlights
- Call-to-action sections

### Community Feed
- Post cards with user info and location
- Like and comment functionality
- Suggested users sidebar
- Trending places
- Quick actions

### Interactive Map
- View all posts on a world map
- Click markers to see post details
- Beautiful popups with images

### User Profile
- Customizable profile information
- Edit profile functionality
- Stats display (posts, followers, following)
- Beautiful gradient design

## 🔒 Authentication

The application supports two authentication modes:

1. **Development Mode** (VITE_DISABLE_CLERK=true)
   - Simple localStorage-based authentication
   - Perfect for development and testing

2. **Production Mode** (with Clerk)
   - Secure authentication with Clerk
   - OAuth support
   - User management

## 🗄️ Database

The application uses a flexible data storage approach:

- **Primary**: MySQL database
- **Fallback**: JSON file storage (automatic fallback if MySQL is unavailable)

This ensures the application works even without a database setup.

## 🎯 API Endpoints

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `POST /api/posts/like/:id` - Like a post
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add a comment

### Admin
- `DELETE /api/admin/posts/:id` - Delete a post

## 🎨 Design System

### Colors
- Primary: Red (#DC2626 - #B91C1C)
- Secondary: Blue, Green gradients
- Neutral: Gray scale

### Typography
- Font: System fonts
- Headers: Bold, large sizes
- Body: Regular weight, readable sizes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Nithishwar Vijay**
- GitHub: [@nithishwarvijay](https://github.com/nithishwarvijay)

## 🙏 Acknowledgments

- Unsplash for beautiful travel images
- OpenStreetMap for map tiles
- The React and Node.js communities

## 📧 Support

For support, email nithishwar16062005@gmail.com or open an issue in the GitHub repository.

---

Made with ❤️ for travelers around the world
