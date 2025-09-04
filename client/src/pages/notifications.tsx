import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCircle, AlertCircle, Info, Calendar, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/unread`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) throw new Error('Failed to mark as unread');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
          <div className="w-48 h-8 bg-gray-300 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="w-full h-4 bg-gray-300 rounded animate-pulse mb-2" />
              <div className="w-3/4 h-3 bg-gray-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/dashboard')}
            className="flex items-center"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft size={16} className="mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="mr-3" size={24} />
              Bildirimlerim
            </h1>
            <p className="text-gray-500 text-sm">
              Tüm bildirimlerinizi burada yönetebilirsiniz
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            size="sm"
            data-testid="button-mark-all-read"
          >
            <CheckCircle size={16} className="mr-2" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            filter === 'all' 
              ? "bg-white text-primary shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="filter-all"
        >
          Tümü ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            filter === 'unread' 
              ? "bg-white text-primary shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="filter-unread"
        >
          Okunmamış ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            filter === 'read' 
              ? "bg-white text-primary shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="filter-read"
        >
          Okunmuş ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Statistics */}
      {notifications.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">İstatistikler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
                <div className="text-sm text-gray-500">Toplam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{unreadCount}</div>
                <div className="text-sm text-gray-500">Okunmamış</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type === 'success').length}
                </div>
                <div className="text-sm text-gray-500">Başarılı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {notifications.filter(n => n.type === 'warning').length}
                </div>
                <div className="text-sm text-gray-500">Uyarı</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BellOff size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'all' && 'Henüz hiç bildiriminiz yok'}
                {filter === 'unread' && 'Okunmamış bildiriminiz yok'}
                {filter === 'read' && 'Okunmuş bildiriminiz yok'}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' && 'Sistem bildirimleri burada görüntülenecek'}
                {filter === 'unread' && 'Tüm bildirimler okunmuş durumda'}
                {filter === 'read' && 'Henüz okunmuş bildiriminiz bulunmuyor'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconColor = getNotificationColor(notification.type);
            
            return (
              <Card 
                key={notification.id} 
                className={cn(
                  "transition-all duration-200 hover:shadow-md border-l-4",
                  notification.isRead ? "border-l-gray-300" : "border-l-primary bg-blue-50/50"
                )}
                data-testid={`notification-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={cn("mt-1", iconColor)}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-semibold",
                            notification.isRead ? "text-gray-700" : "text-gray-900"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Badge variant="secondary" className="text-xs">
                              Yeni
                            </Badge>
                          )}
                        </div>
                        <p className={cn(
                          "text-sm",
                          notification.isRead ? "text-gray-500" : "text-gray-700"
                        )}>
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <div className="flex items-center">
                            <Calendar size={12} className="mr-1" />
                            {formatDistanceToNow(new Date(notification.createdAt), { 
                              addSuffix: true,
                              locale: tr 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => notification.isRead 
                        ? markAsUnreadMutation.mutate(notification.id)
                        : markAsReadMutation.mutate(notification.id)
                      }
                      disabled={markAsReadMutation.isPending || markAsUnreadMutation.isPending}
                      className="ml-2 h-8 w-8 p-0"
                      data-testid={`button-toggle-read-${notification.id}`}
                    >
                      {notification.isRead ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
}