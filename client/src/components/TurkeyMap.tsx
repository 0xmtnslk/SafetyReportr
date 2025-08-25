import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Turkey cities with SVG path data and coordinates
const TURKEY_CITIES_MAP = {
  "İstanbul": { path: "M136,149 L140,147 L145,148 L148,151 L146,155 L142,156 L138,154 L136,151 Z", color: "#e11d48" },
  "Ankara": { path: "M185,167 L190,165 L195,167 L197,172 L194,176 L189,177 L184,175 L182,170 Z", color: "#dc2626" },
  "İzmir": { path: "M95,185 L100,183 L105,185 L107,190 L104,194 L99,195 L94,193 L92,188 Z", color: "#ea580c" },
  "Bursa": { path: "M125,162 L130,160 L135,162 L137,167 L134,171 L129,172 L124,170 L122,165 Z", color: "#ca8a04" },
  "Antalya": { path: "M170,220 L175,218 L180,220 L182,225 L179,229 L174,230 L169,228 L167,223 Z", color: "#65a30d" },
  "Adana": { path: "M205,210 L210,208 L215,210 L217,215 L214,219 L209,220 L204,218 L202,213 Z", color: "#16a34a" },
  "Konya": { path: "M175,185 L180,183 L185,185 L187,190 L184,194 L179,195 L174,193 L172,188 Z", color: "#059669" },
  "Gaziantep": { path: "M220,200 L225,198 L230,200 L232,205 L229,209 L224,210 L219,208 L217,203 Z", color: "#0891b2" },
  "Kocaeli": { path: "M140,155 L145,153 L150,155 L152,160 L149,164 L144,165 L139,163 L137,158 Z", color: "#0284c7" },
  "Mersin": { path: "M190,215 L195,213 L200,215 L202,220 L199,224 L194,225 L189,223 L187,218 Z", color: "#2563eb" },
  "Eskişehir": { path: "M160,170 L165,168 L170,170 L172,175 L169,179 L164,180 L159,178 L157,173 Z", color: "#7c3aed" },
  "Diyarbakır": { path: "M280,200 L285,198 L290,200 L292,205 L289,209 L284,210 L279,208 L277,203 Z", color: "#c026d3" },
  "Samsun": { path: "M220,130 L225,128 L230,130 L232,135 L229,139 L224,140 L219,138 L217,133 Z", color: "#dc2626" },
  "Denizli": { path: "M135,195 L140,193 L145,195 L147,200 L144,204 L139,205 L134,203 L132,198 Z", color: "#ea580c" },
  "Şanlıurfa": { path: "M250,205 L255,203 L260,205 L262,210 L259,214 L254,215 L249,213 L247,208 Z", color: "#ca8a04" },
  "Adapazarı": { path: "M145,150 L150,148 L155,150 L157,155 L154,159 L149,160 L144,158 L142,153 Z", color: "#65a30d" },
  "Malatya": { path: "M260,180 L265,178 L270,180 L272,185 L269,189 L264,190 L259,188 L257,183 Z", color: "#16a34a" },
  "Erzurum": { path: "M310,160 L315,158 L320,160 L322,165 L319,169 L314,170 L309,168 L307,163 Z", color: "#059669" },
  "Manisa": { path: "M110,175 L115,173 L120,175 L122,180 L119,184 L114,185 L109,183 L107,178 Z", color: "#0891b2" },
  "Trabzon": { path: "M290,125 L295,123 L300,125 L302,130 L299,134 L294,135 L289,133 L287,128 Z", color: "#0284c7" },
  "Kayseri": { path: "M210,175 L215,173 L220,175 L222,180 L219,184 L214,185 L209,183 L207,178 Z", color: "#2563eb" },
  "Balıkesir": { path: "M105,155 L110,153 L115,155 L117,160 L114,164 L109,165 L104,163 L102,158 Z", color: "#7c3aed" },
  "Van": { path: "M340,190 L345,188 L350,190 L352,195 L349,199 L344,200 L339,198 L337,193 Z", color: "#c026d3" },
  "Aydın": { path: "M115,190 L120,188 L125,190 L127,195 L124,199 L119,200 L114,198 L112,193 Z", color: "#dc2626" },
  "Tekirdağ": { path: "M115,140 L120,138 L125,140 L127,145 L124,149 L119,150 L114,148 L112,143 Z", color: "#ea580c" },
  "Elazığ": { path: "M270,185 L275,183 L280,185 L282,190 L279,194 L274,195 L269,193 L267,188 Z", color: "#ca8a04" },
  "Sivas": { path: "M240,160 L245,158 L250,160 L252,165 L249,169 L244,170 L239,168 L237,163 Z", color: "#65a30d" },
  "Çanakkale": { path: "M85,150 L90,148 L95,150 L97,155 L94,159 L89,160 L84,158 L82,153 Z", color: "#16a34a" },
  "Muğla": { path: "M125,215 L130,213 L135,215 L137,220 L134,224 L129,225 L124,223 L122,218 Z", color: "#059669" },
  "Ordu": { path: "M250,135 L255,133 L260,135 L262,140 L259,144 L254,145 L249,143 L247,138 Z", color: "#0891b2" },
  "Afyon": { path: "M155,185 L160,183 L165,185 L167,190 L164,194 L159,195 L154,193 L152,188 Z", color: "#0284c7" },
  "Zonguldak": { path: "M180,135 L185,133 L190,135 L192,140 L189,144 L184,145 L179,143 L177,138 Z", color: "#2563eb" },
  "Kırklareli": { path: "M125,125 L130,123 L135,125 L137,130 L134,134 L129,135 L124,133 L122,128 Z", color: "#7c3aed" },
  "Uşak": { path: "M140,185 L145,183 L150,185 L152,190 L149,194 L144,195 L139,193 L137,188 Z", color: "#c026d3" },
  "Isparta": { path: "M155,200 L160,198 L165,200 L167,205 L164,209 L159,210 L154,208 L152,203 Z", color: "#dc2626" },
  "Kastamonu": { path: "M195,145 L200,143 L205,145 L207,150 L204,154 L199,155 L194,153 L192,148 Z", color: "#ea580c" },
  "Tokat": { path: "M220,155 L225,153 L230,155 L232,160 L229,164 L224,165 L219,163 L217,158 Z", color: "#ca8a04" },
  "Çorum": { path: "M200,160 L205,158 L210,160 L212,165 L209,169 L204,170 L199,168 L197,163 Z", color: "#65a30d" },
  "Sakarya": { path: "M150,157 L155,155 L160,157 L162,162 L159,166 L154,167 L149,165 L147,160 Z", color: "#16a34a" },
  "Edirne": { path: "M105,120 L110,118 L115,120 L117,125 L114,129 L109,130 L104,128 L102,123 Z", color: "#059669" },
  "Mardin": { path: "M285,215 L290,213 L295,215 L297,220 L294,224 L289,225 L284,223 L282,218 Z", color: "#0891b2" },
  "Amasya": { path: "M210,150 L215,148 L220,150 L222,155 L219,159 L214,160 L209,158 L207,153 Z", color: "#0284c7" },
  "Giresun": { path: "M270,130 L275,128 L280,130 L282,135 L279,139 L274,140 L269,138 L267,133 Z", color: "#2563eb" },
  "Yozgat": { path: "M200,170 L205,168 L210,170 L212,175 L209,179 L204,180 L199,178 L197,173 Z", color: "#7c3aed" },
  "Hatay": { path: "M215,230 L220,228 L225,230 L227,235 L224,239 L219,240 L214,238 L212,233 Z", color: "#c026d3" },
  "Sinop": { path: "M200,125 L205,123 L210,125 L212,130 L209,134 L204,135 L199,133 L197,128 Z", color: "#dc2626" },
  "Kırıkkale": { path: "M190,160 L195,158 L200,160 L202,165 L199,169 L194,170 L189,168 L187,163 Z", color: "#ea580c" },
  "Kütahya": { path: "M145,175 L150,173 L155,175 L157,180 L154,184 L149,185 L144,183 L142,178 Z", color: "#ca8a04" },
  "Bilecik": { path: "M155,165 L160,163 L165,165 L167,170 L164,174 L159,175 L154,173 L152,168 Z", color: "#65a30d" },
  "Nevşehir": { path: "M190,180 L195,178 L200,180 L202,185 L199,189 L194,190 L189,188 L187,183 Z", color: "#16a34a" },
  "Kırşehir": { path: "M185,175 L190,173 L195,175 L197,180 L194,184 L189,185 L184,183 L182,178 Z", color: "#059669" },
  "Bolu": { path: "M170,155 L175,153 L180,155 L182,160 L179,164 L174,165 L169,163 L167,158 Z", color: "#0891b2" },
  "Aksaray": { path: "M180,190 L185,188 L190,190 L192,195 L189,199 L184,200 L179,198 L177,193 Z", color: "#0284c7" },
  "Niğde": { path: "M190,195 L195,193 L200,195 L202,200 L199,204 L194,205 L189,203 L187,198 Z", color: "#2563eb" },
  "Karaman": { path: "M180,205 L185,203 L190,205 L192,210 L189,214 L184,215 L179,213 L177,208 Z", color: "#7c3aed" },
  "Burdur": { path: "M150,205 L155,203 L160,205 L162,210 L159,214 L154,215 L149,213 L147,208 Z", color: "#c026d3" },
  "Bingöl": { path: "M285,185 L290,183 L295,185 L297,190 L294,194 L289,195 L284,193 L282,188 Z", color: "#dc2626" },
  "Erzincan": { path: "M280,165 L285,163 L290,165 L292,170 L289,174 L284,175 L279,173 L277,168 Z", color: "#ea580c" },
  "Gümüşhane": { path: "M285,140 L290,138 L295,140 L297,145 L294,149 L289,150 L284,148 L282,143 Z", color: "#ca8a04" },
  "Artvin": { path: "M305,135 L310,133 L315,135 L317,140 L314,144 L309,145 L304,143 L302,138 Z", color: "#65a30d" },
  "Rize": { path: "M295,135 L300,133 L305,135 L307,140 L304,144 L299,145 L294,143 L292,138 Z", color: "#16a34a" },
  "Bayburt": { path: "M290,150 L295,148 L300,150 L302,155 L299,159 L294,160 L289,158 L287,153 Z", color: "#059669" },
  "Muş": { path: "M310,190 L315,188 L320,190 L322,195 L319,199 L314,200 L309,198 L307,193 Z", color: "#0891b2" },
  "Bitlis": { path: "M320,195 L325,193 L330,195 L332,200 L329,204 L324,205 L319,203 L317,198 Z", color: "#0284c7" },
  "Siirt": { path: "M305,210 L310,208 L315,210 L317,215 L314,219 L309,220 L304,218 L302,213 Z", color: "#2563eb" },
  "Batman": { path: "M295,205 L300,203 L305,205 L307,210 L304,214 L299,215 L294,213 L292,208 Z", color: "#7c3aed" },
  "Tunceli": { path: "M270,175 L275,173 L280,175 L282,180 L279,184 L274,185 L269,183 L267,178 Z", color: "#c026d3" },
  "Kilis": { path: "M225,215 L230,213 L235,215 L237,220 L234,224 L229,225 L224,223 L222,218 Z", color: "#dc2626" },
  "Osmaniye": { path: "M210,215 L215,213 L220,215 L222,220 L219,224 L214,225 L209,223 L207,218 Z", color: "#ea580c" },
  "Kahramanmaraş": { path: "M230,190 L235,188 L240,190 L242,195 L239,199 L234,200 L229,198 L227,193 Z", color: "#ca8a04" },
  "Adıyaman": { path: "M250,195 L255,193 L260,195 L262,200 L259,204 L254,205 L249,203 L247,198 Z", color: "#65a30d" },
  "Bartın": { path: "M175,135 L180,133 L185,135 L187,140 L184,144 L179,145 L174,143 L172,138 Z", color: "#16a34a" },
  "Karabük": { path: "M185,140 L190,138 L195,140 L197,145 L194,149 L189,150 L184,148 L182,143 Z", color: "#059669" },
  "Kars": { path: "M330,150 L335,148 L340,150 L342,155 L339,159 L334,160 L329,158 L327,153 Z", color: "#0891b2" },
  "Ardahan": { path: "M325,140 L330,138 L335,140 L337,145 L334,149 L329,150 L324,148 L322,143 Z", color: "#0284c7" },
  "Iğdır": { path: "M340,155 L345,153 L350,155 L352,160 L349,164 L344,165 L339,163 L337,158 Z", color: "#2563eb" },
  "Ağrı": { path: "M330,165 L335,163 L340,165 L342,170 L339,174 L334,175 L329,173 L327,168 Z", color: "#7c3aed" },
  "Hakkari": { path: "M350,200 L355,198 L360,200 L362,205 L359,209 L354,210 L349,208 L347,203 Z", color: "#c026d3" },
  "Şırnak": { path: "M320,210 L325,208 L330,210 L332,215 L329,219 L324,220 L319,218 L317,213 Z", color: "#dc2626" }
};

// Hospital statistics per city (this will be calculated from real data)
interface TurkeyMapProps {
  hospitals: Array<{
    id: string;
    name: string;
    city: string;
    district: string;
  }>;
  onCityHover?: (city: string, hospitals: Array<any>) => void;
  onCityClick?: (city: string, hospitals: Array<any>) => void;
}

export default function TurkeyMap({ hospitals, onCityHover, onCityClick }: TurkeyMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // Group hospitals by city
  const hospitalsByCity = hospitals.reduce((acc, hospital) => {
    if (!acc[hospital.city]) {
      acc[hospital.city] = [];
    }
    acc[hospital.city].push(hospital);
    return acc;
  }, {} as Record<string, typeof hospitals>);

  // Get color based on hospital count in city
  const getCityColor = (cityName: string) => {
    const hospitalCount = hospitalsByCity[cityName]?.length || 0;
    if (hospitalCount === 0) {
      return "#e5e7eb"; // Gray for no hospitals
    } else if (hospitalCount === 1) {
      return "#3b82f6"; // Blue for 1 hospital
    } else if (hospitalCount <= 3) {
      return "#10b981"; // Green for 2-3 hospitals
    } else {
      return "#f59e0b"; // Orange for 4+ hospitals
    }
  };

  // Get stroke color for hover/selection
  const getStrokeColor = (cityName: string) => {
    if (hoveredCity === cityName) {
      return "#1f2937";
    }
    return "#9ca3af";
  };

  const handleCityMouseEnter = (cityName: string) => {
    setHoveredCity(cityName);
    if (onCityHover && hospitalsByCity[cityName]) {
      onCityHover(cityName, hospitalsByCity[cityName]);
    }
  };

  const handleCityMouseLeave = () => {
    setHoveredCity(null);
  };

  const handleCityClick = (cityName: string) => {
    if (onCityClick && hospitalsByCity[cityName]) {
      onCityClick(cityName, hospitalsByCity[cityName]);
    }
  };

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 400 280"
        className="w-full h-auto max-w-4xl mx-auto"
        style={{ aspectRatio: '400/280' }}
      >
        {/* Background */}
        <rect width="400" height="280" fill="#f8fafc" />
        
        {/* City paths */}
        {Object.entries(TURKEY_CITIES_MAP).map(([cityName, cityData]) => (
          <path
            key={cityName}
            d={cityData.path}
            fill={getCityColor(cityName)}
            stroke={getStrokeColor(cityName)}
            strokeWidth={hoveredCity === cityName ? "2" : "1"}
            className={cn(
              "transition-all duration-200 cursor-pointer",
              hospitalsByCity[cityName]?.length > 0 && "drop-shadow-sm"
            )}
            onMouseEnter={() => handleCityMouseEnter(cityName)}
            onMouseLeave={handleCityMouseLeave}
            onClick={() => handleCityClick(cityName)}
          />
        ))}
        
        {/* City labels for cities with hospitals */}
        {Object.entries(hospitalsByCity).map(([cityName, cityHospitals]) => {
          const cityData = TURKEY_CITIES_MAP[cityName as keyof typeof TURKEY_CITIES_MAP];
          if (!cityData || cityHospitals.length === 0) return null;
          
          // Calculate center of the path (simplified)
          const pathBBox = cityData.path.match(/(\d+)/g);
          if (!pathBBox || pathBBox.length < 4) return null;
          
          const x = (parseInt(pathBBox[0]) + parseInt(pathBBox[2])) / 2;
          const y = (parseInt(pathBBox[1]) + parseInt(pathBBox[3])) / 2;
          
          return (
            <g key={`label-${cityName}`}>
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-sm"
              />
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                className="text-xs font-bold fill-white"
                style={{ fontSize: '10px' }}
              >
                {cityHospitals.length}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#e5e7eb" }}></div>
          <span>Hastane Yok</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
          <span>1 Hastane</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
          <span>2-3 Hastane</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
          <span>4+ Hastane</span>
        </div>
      </div>
    </div>
  );
}