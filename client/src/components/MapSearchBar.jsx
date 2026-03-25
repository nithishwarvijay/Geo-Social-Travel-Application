import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';

/**
 * MapSearchBar — a location search component that sits inside a Leaflet MapContainer.
 * Uses OpenStreetMap Nominatim for geocoding (free, no API key needed).
 *
 * Props:
 *  - onLocationSelect(lat, lng, displayName) — optional callback when a place is picked
 *  - placeholder                            — optional input placeholder text
 */
export default function MapSearchBar({ onLocationSelect, placeholder = 'Search for a location...' }) {
    const map = useMap();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchLocation = useCallback(async (searchText) => {
        if (!searchText || searchText.trim().length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const encoded = encodeURIComponent(searchText.trim());
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            setResults(data);
            setShowResults(true);
        } catch (err) {
            console.error('Geocoding error:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Debounce API calls (400ms)
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchLocation(value), 400);
    };

    const handleSelect = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        setQuery(result.display_name);
        setShowResults(false);
        setResults([]);

        // Fly the map to the selected location
        map.flyTo([lat, lng], 14, { duration: 1.5 });

        // Notify parent
        if (onLocationSelect) {
            onLocationSelect(lat, lng, result.display_name);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (results.length > 0) {
                handleSelect(results[0]);
            } else {
                searchLocation(query);
            }
        }
    };

    // Format the result type for a nice label
    const formatType = (result) => {
        const type = result.type || '';
        const category = result.class || '';
        if (type === 'city' || type === 'town' || type === 'village') return '🏙️';
        if (category === 'tourism') return '🏛️';
        if (category === 'natural') return '🌿';
        if (type === 'country') return '🌍';
        if (category === 'highway' || category === 'road') return '🛣️';
        return '📍';
    };

    // Stop map events from propagating when interacting with the search bar
    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    return (
        <div
            ref={wrapperRef}
            className="leaflet-top leaflet-left"
            style={{
                position: 'absolute',
                top: '10px',
                left: '50px',
                right: '10px',
                zIndex: 1000,
                pointerEvents: 'auto',
            }}
            onMouseDown={stopPropagation}
            onDoubleClick={stopPropagation}
            onWheel={stopPropagation}
            onClick={stopPropagation}
        >
            <div style={{ maxWidth: '400px', width: '100%' }}>
                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: '2px solid #e5e7eb',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}>
                        <span style={{
                            padding: '0 0 0 14px',
                            fontSize: '18px',
                            color: '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            🔍
                        </span>
                        <input
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => results.length > 0 && setShowResults(true)}
                            placeholder={placeholder}
                            style={{
                                flex: 1,
                                padding: '12px 14px',
                                border: 'none',
                                outline: 'none',
                                fontSize: '15px',
                                fontFamily: 'inherit',
                                background: 'transparent',
                                color: '#1f2937',
                            }}
                        />
                        {loading && (
                            <div style={{
                                padding: '0 14px 0 0',
                                display: 'flex',
                                alignItems: 'center',
                            }}>
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    border: '2px solid #e5e7eb',
                                    borderTopColor: '#3b82f6',
                                    borderRadius: '50%',
                                    animation: 'spin 0.6s linear infinite',
                                }} />
                            </div>
                        )}
                        {query && !loading && (
                            <button
                                onClick={() => {
                                    setQuery('');
                                    setResults([]);
                                    setShowResults(false);
                                }}
                                style={{
                                    padding: '0 14px 0 0',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    color: '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Results Dropdown */}
                {showResults && results.length > 0 && (
                    <div style={{
                        marginTop: '6px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden',
                        maxHeight: '280px',
                        overflowY: 'auto',
                    }}>
                        {results.map((result, idx) => (
                            <button
                                key={result.place_id || idx}
                                onClick={() => handleSelect(result)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    borderBottom: idx < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    background: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.15s',
                                    fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                <span style={{ fontSize: '20px', marginTop: '2px', flexShrink: 0 }}>
                                    {formatType(result)}
                                </span>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#1f2937',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {result.display_name.split(',')[0]}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginTop: '2px',
                                    }}>
                                        {result.display_name.split(',').slice(1).join(',').trim()}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* No results message */}
                {showResults && results.length === 0 && query.length >= 2 && !loading && (
                    <div style={{
                        marginTop: '6px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        padding: '16px',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '14px',
                    }}>
                        No locations found for "{query}"
                    </div>
                )}
            </div>

            {/* Inline keyframe animation for the spinner */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
