'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface EventMapProps {
  latitude: number;
  longitude: number;
  location: string;
  height?: string;
}

export default function EventMap({ latitude, longitude, location, height = '400px' }: EventMapProps) {
  useEffect(() => {
    // Create map
    const map = L.map('event-map').setView([latitude, longitude], 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker
    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`<strong>${location}</strong>`).openPopup();

    // Cleanup
    return () => {
      map.remove();
    };
  }, [latitude, longitude, location]);

  return (
    <div 
      id="event-map" 
      style={{ height, width: '100%', borderRadius: '10px' }}
      className="border border-slate-300"
    />
  );
}
