"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Image from "next/image";
import BlurFade from "./magicui/blur-fade";

// CSS import for Leaflet
import "leaflet/dist/leaflet.css";

interface UdaipurMapProps {
  delay?: number;
}

// New location data for Udaipur
const locations = {
  "CityPalace": {
    name: "City Palace",
    description: "A stunning palace complex on the banks of Lake Pichola.",
    coordinates: [24.5765, 73.6835], // Lat, Lon for Leaflet
    type: "urban"
  },
  "LakePichola": {
    name: "Lake Pichola",
    description: "The iconic artificial freshwater lake, home to Jag Mandir.",
    coordinates: [24.5721, 73.6775],
    type: "nature"
  },
  "JagMandir": {
    name: "Jag Mandir",
    description: "A beautiful palace built on an island in Lake Pichola.",
    coordinates: [24.5694, 73.6757],
    type: "urban"
  },
  "SaheliyonKiBari": {
    name: "Saheliyon Ki Bari",
    description: "Courtyard of the Maidens, a beautiful garden.",
    coordinates: [24.5986, 73.6888],
    type: "nature"
  },
  "MonsoonPalace": {
    name: "Sajjangarh Monsoon Palace",
    description: "A hilltop palace with panoramic views of the city's lakes.",
    coordinates: [24.5954, 73.6401],
    type: "nature"
  },
  "FatehSagarLake": {
    name: "Fateh Sagar Lake",
    description: "A popular spot for boating and evening strolls.",
    coordinates: [24.6001, 73.6753],
    type: "nature"
  },
  "JagdishTemple": {
    name: "Jagdish Temple",
    description: "A large and artistically important Hindu temple in the city.",
    coordinates: [24.5794, 73.6835],
    type: "urban"
  },
  "AmbraiGhat": {
    name: "Ambrai Ghat",
    description: "A famous ghat offering spectacular views of the City Palace.",
    coordinates: [24.5759, 73.6788],
    type: "urban"
  }
};

// Custom icon definitions remain the same
const natureIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const urbanIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const UdaipurMap = ({ delay = 0 }: UdaipurMapProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <BlurFade delay={delay}>
        <div className="flex justify-center">
          <div className="bg-card border rounded-lg p-6 w-full max-w-4xl">
            <div className="h-96 flex items-center justify-center">
              Loading Udaipur Map...
            </div>
          </div>
        </div>
      </BlurFade>
    );
  }

  return (
    <BlurFade delay={delay}>
      <div className="flex justify-center">
        <div className="bg-card border rounded-lg p-6 w-full max-w-4xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-full h-96 max-w-4xl rounded-lg overflow-hidden border">
              <MapContainer 
                center={[24.5857, 73.7129]} // Center of Udaipur
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {Object.entries(locations).map(([key, location]) => (
                  <Marker
                    key={key}
                    position={location.coordinates as [number, number]}
                    icon={location.type === 'nature' ? natureIcon : urbanIcon}
                  >
                    <Popup>
                      <span className="font-semibold">{location.name}</span>
                      <br />
                      {location.description}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Image 
                  src={natureIcon.options.iconUrl} 
                  alt="Nature" 
                  width={16} 
                  height={16} 
                  className="w-4 h-auto"
                />
                <span>Nature</span>
              </div>
              <div className="flex items-center space-x-2">
                <Image 
                  src={urbanIcon.options.iconUrl} 
                  alt="Urban" 
                  width={16} 
                  height={16} 
                  className="w-4 h-auto"
                />
                <span>Urban</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BlurFade>
  );
};

export default UdaipurMap;