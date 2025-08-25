import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Turkey SVG path for the country outline (simplified realistic shape)
const TURKEY_OUTLINE_PATH = "M160,160 L180,155 L200,150 L230,148 L270,150 L310,155 L350,160 L390,165 L430,170 L470,175 L510,180 L550,185 L590,190 L630,195 L670,200 L710,210 L720,220 L715,230 L710,240 L700,250 L690,260 L680,270 L670,280 L660,290 L650,300 L640,310 L630,320 L620,330 L610,340 L600,350 L580,360 L560,370 L540,380 L520,390 L500,395 L480,390 L460,385 L440,380 L420,375 L400,370 L380,365 L360,360 L340,355 L320,350 L300,345 L280,340 L260,335 L240,330 L220,325 L200,320 L180,315 L160,310 L140,305 L120,300 L100,295 L90,285 L85,275 L80,265 L85,255 L90,245 L100,235 L110,225 L120,215 L130,205 L140,195 L150,185 L155,175 L160,165 Z";

// Cities with their approximate positions on the Turkey map
const TURKEY_CITIES = {
  "İstanbul": { x: 245, y: 180 },
  "Ankara": { x: 320, y: 220 },
  "İzmir": { x: 180, y: 260 },
  "Bursa": { x: 220, y: 200 },
  "Antalya": { x: 330, y: 300 },
  "Adana": { x: 400, y: 310 },
  "Konya": { x: 340, y: 260 },
  "Gaziantep": { x: 420, y: 320 },
  "Kayseri": { x: 380, y: 250 },
  "Mersin": { x: 380, y: 320 },
  "Eskişehir": { x: 280, y: 230 },
  "Diyarbakır": { x: 500, y: 290 },
  "Samsun": { x: 380, y: 170 },
  "Denizli": { x: 250, y: 280 },
  "Şanlıurfa": { x: 460, y: 320 },
  "Adapazarı": { x: 260, y: 190 },
  "Malatya": { x: 450, y: 260 },
  "Kahramanmaraş": { x: 420, y: 280 },
  "Erzurum": { x: 520, y: 230 },
  "Van": { x: 580, y: 270 },
  "Batman": { x: 520, y: 300 },
  "Elazığ": { x: 460, y: 270 },
  "Erzincan": { x: 480, y: 240 },
  "Tokat": { x: 400, y: 210 },
  "Sivas": { x: 420, y: 230 },
  "Trabzon": { x: 450, y: 180 },
  "Ordu": { x: 420, y: 180 },
  "Giresun": { x: 440, y: 170 },
  "Rize": { x: 470, y: 170 },
  "Artvin": { x: 500, y: 160 },
  "Bayburt": { x: 480, y: 200 },
  "Gümüşhane": { x: 460, y: 200 },
  "Amasya": { x: 380, y: 200 },
  "Çorum": { x: 360, y: 200 },
  "Sinop": { x: 360, y: 150 },
  "Kastamonu": { x: 340, y: 160 },
  "Bartın": { x: 320, y: 150 },
  "Karabük": { x: 320, y: 170 },
  "Zonguldak": { x: 300, y: 160 },
  "Bolu": { x: 300, y: 190 },
  "Düzce": { x: 280, y: 180 },
  "Sakarya": { x: 270, y: 190 },
  "Kocaeli": { x: 260, y: 180 },
  "Yalova": { x: 240, y: 190 },
  "Tekirdağ": { x: 200, y: 180 },
  "Kırklareli": { x: 180, y: 160 },
  "Edirne": { x: 160, y: 150 },
  "Çanakkale": { x: 160, y: 210 },
  "Balıkesir": { x: 200, y: 230 },
  "Manisa": { x: 190, y: 250 },
  "Aydın": { x: 200, y: 280 },
  "Muğla": { x: 220, y: 310 },
  "Burdur": { x: 270, y: 290 },
  "Isparta": { x: 290, y: 280 },
  "Afyonkarahisar": { x: 270, y: 250 },
  "Kütahya": { x: 250, y: 240 },
  "Bilecik": { x: 260, y: 220 },
  "Çankırı": { x: 320, y: 200 },
  "Kırıkkale": { x: 340, y: 210 },
  "Kırşehir": { x: 360, y: 230 },
  "Yozgat": { x: 380, y: 220 },
  "Nevşehir": { x: 370, y: 250 },
  "Aksaray": { x: 350, y: 270 },
  "Niğde": { x: 370, y: 280 },
  "Karaman": { x: 360, y: 290 },
  "Hatay": { x: 400, y: 340 },
  "Osmaniye": { x: 390, y: 330 },
  "Kilis": { x: 410, y: 330 },
  "Mardin": { x: 510, y: 310 },
  "Siirt": { x: 530, y: 300 },
  "Şırnak": { x: 560, y: 310 },
  "Hakkâri": { x: 580, y: 300 },
  "Bitlis": { x: 560, y: 280 },
  "Muş": { x: 540, y: 270 },
  "Bingöl": { x: 480, y: 260 },
  "Tunceli": { x: 470, y: 250 },
  "Adıyaman": { x: 440, y: 290 },
  "Ağrı": { x: 560, y: 250 },
  "Iğdır": { x: 590, y: 230 },
  "Kars": { x: 570, y: 210 },
  "Ardahan": { x: 530, y: 190 },
  "Uşak": { x: 230, y: 260 }
};

interface Hospital {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  isActive: boolean;
  logoUrl?: string;
  userCount?: number;
}

interface TurkeyMapProps {
  hospitals: Hospital[];
  onCityHover?: (city: string, hospitals: Hospital[]) => void;
  onCityClick?: (city: string, hospitals: Hospital[]) => void;
}

const TurkeyMap: React.FC<TurkeyMapProps> = ({ hospitals, onCityHover, onCityClick }) => {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Group hospitals by city
  const hospitalsByCity = hospitals.reduce((acc, hospital) => {
    const city = hospital.city;
    if (!acc[city]) acc[city] = [];
    acc[city].push(hospital);
    return acc;
  }, {} as Record<string, Hospital[]>);

  // Get color based on hospital count
  const getCityColor = (city: string) => {
    const cityHospitals = hospitalsByCity[city] || [];
    const count = cityHospitals.length;
    
    if (count === 0) return '#e5e7eb'; // gray-200
    if (count === 1) return '#3b82f6'; // blue-500
    if (count <= 3) return '#10b981'; // green-500
    return '#f59e0b'; // orange-500
  };

  const handleCityMouseEnter = (city: string, event: React.MouseEvent) => {
    setHoveredCity(city);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    
    const cityHospitals = hospitalsByCity[city] || [];
    onCityHover?.(city, cityHospitals);
  };

  const handleCityMouseLeave = () => {
    setHoveredCity(null);
  };

  const handleCityClick = (city: string) => {
    const cityHospitals = hospitalsByCity[city] || [];
    onCityClick?.(city, cityHospitals);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <svg 
        viewBox="0 0 800 450" 
        className="w-full h-auto border border-gray-200 rounded-lg bg-blue-50"
        style={{ aspectRatio: '800/450' }}
      >
        {/* Turkey country outline */}
        <path
          d={TURKEY_OUTLINE_PATH}
          fill="#f8fafc"
          stroke="#64748b"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        
        {/* City markers */}
        {Object.entries(TURKEY_CITIES).map(([city, position]) => {
          const cityHospitals = hospitalsByCity[city] || [];
          const hospitalCount = cityHospitals.length;
          const color = getCityColor(city);
          
          return (
            <g key={city}>
              {/* City circle */}
              <circle
                cx={position.x}
                cy={position.y}
                r={hospitalCount > 0 ? Math.max(4, Math.min(12, 4 + hospitalCount * 2)) : 3}
                fill={color}
                stroke="#fff"
                strokeWidth="2"
                className={cn(
                  "cursor-pointer transition-all duration-200 drop-shadow-sm",
                  hoveredCity === city && "scale-125 drop-shadow-md"
                )}
                onMouseEnter={(e) => handleCityMouseEnter(city, e)}
                onMouseLeave={handleCityMouseLeave}
                onClick={() => handleCityClick(city)}
              />
              
              {/* Hospital count label for cities with hospitals */}
              {hospitalCount > 0 && (
                <text
                  x={position.x}
                  y={position.y + 1}
                  textAnchor="middle"
                  className="text-xs font-bold fill-white pointer-events-none select-none"
                  style={{ fontSize: '8px' }}
                >
                  {hospitalCount}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredCity && (
        <div
          className="fixed z-50 bg-black text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="font-semibold">{hoveredCity}</div>
          <div className="text-xs opacity-80">
            {hospitalsByCity[hoveredCity]?.length || 0} hastane
          </div>
          {hospitalsByCity[hoveredCity] && (
            <div className="text-xs mt-1">
              {hospitalsByCity[hoveredCity].map(h => h.name).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></div>
          <span>Hastane yok</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 border border-gray-300"></div>
          <span>1 hastane</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 border border-gray-300"></div>
          <span>2-3 hastane</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 border border-gray-300"></div>
          <span>4+ hastane</span>
        </div>
      </div>
    </div>
  );
};

export default TurkeyMap;