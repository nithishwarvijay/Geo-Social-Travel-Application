import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const disableClerk = String(import.meta.env.VITE_DISABLE_CLERK || '').toLowerCase() === 'true';
  const isAuthenticated = disableClerk ? localStorage.getItem('isAuthenticated') === 'true' : false;
  
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: "Let's Go Now",
      subtitle: "Discover Amazing Places"
    },
    {
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: "Adventure Awaits",
      subtitle: "Explore the World"
    },
    {
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: "Share Your Journey",
      subtitle: "Connect with Travelers"
    }
  ];

  const destinations = [
    {
      name: "Maldives",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      price: "$1,200"
    },
    {
      name: "Switzerland", 
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      price: "$800"
    },
    {
      name: "Japan",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
      price: "$950"
    }
  ];

  const features = [
    {
      icon: "🗺️",
      title: "Explore",
      description: "Discover amazing destinations around the world"
    },
    {
      icon: "📸", 
      title: "Capture",
      description: "Share your travel moments with the community"
    },
    {
      icon: "🌍",
      title: "Connect",
      description: "Meet fellow travelers and share experiences"
    },
    {
      icon: "✈️",
      title: "Adventure",
      description: "Plan your next adventure with our tools"
    },
    {
      icon: "💫",
      title: "Memories",
      description: "Create lasting memories that will inspire others"
    },
    {
      icon: "🎯",
      title: "Discover",
      description: "Find hidden gems recommended by locals"
    }
  ];

  const travelPhotos = [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header with Login Button */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-20 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-2xl font-bold text-white">
            Geo Social Travel
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-white hover:text-gray-300 font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40" />
          </div>
        ))}
        
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <div className="max-w-4xl px-4">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 tracking-tight">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 font-light">
              {heroSlides[currentSlide].subtitle}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to={isAuthenticated ? "/feed" : "/login"}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
              >
                Explore Feed
              </Link>
              <Link
                to={isAuthenticated ? "/create" : "/signup"}
                className="border-2 border-white hover:bg-white hover:text-black text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
              >
                Share Journey
              </Link>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Destinations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your</h2>
            <h3 className="text-5xl font-bold text-red-600 mb-8">DESTINATION</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover breathtaking destinations around the world. From tropical paradises to mountain adventures.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {destinations.map((dest, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h4 className="text-2xl font-bold mb-2">{dest.name}</h4>
                    <p className="text-red-400 font-semibold">{dest.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Us</h2>
            <h3 className="text-5xl font-bold text-red-600 mb-8">SPECIALTY</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the best travel experience with our unique features and community-driven platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Travel</h2>
            <h3 className="text-5xl font-bold text-red-600 mb-8">MEMORIES</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore amazing travel photos shared by our community members from around the world.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {travelPhotos.map((photo, index) => (
              <div key={index} className="group cursor-pointer overflow-hidden rounded-xl">
                <img
                  src={photo}
                  alt={`Travel memory ${index + 1}`}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready for Your Next Adventure?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join our community of travelers and start sharing your journey today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to={isAuthenticated ? "/feed" : "/login"}
              className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-full text-lg font-semibold transition-colors"
            >
              Explore Now
            </Link>
            <Link
              to={isAuthenticated ? "/signup" : "/signup"}
              className="border-2 border-white hover:bg-white hover:text-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}