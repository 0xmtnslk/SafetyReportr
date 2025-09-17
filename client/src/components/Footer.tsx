import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>© 2025 Sağlık, Emniyet Çevre Yönetimi</span>
            <span>•</span>
            <span>Tüm hakları saklıdır</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for workplace safety</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>Sağlık, Emniyet Çevre Yönetimi</p>
          <p className="mt-1">Fine-Kinney Risk Analizi • Kapsamlı Raporlama • Gerçek Zamanlı Takip</p>
        </div>
      </div>
    </footer>
  );
}