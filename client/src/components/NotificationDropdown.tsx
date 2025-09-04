import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, BellDot, CheckCheck, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch unread notification count
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen, // Only fetch when dropdown is open
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const unreadCount = countData?.count || 0;
  const hasUnread = unreadCount > 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inspection_assigned':
        return '📋';
      case 'inspection_completed':
        return '✅';
      case 'inspection_overdue':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'inspection_assigned':
        return 'text-blue-600';
      case 'inspection_completed':
        return 'text-green-600';
      case 'inspection_overdue':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          data-testid="button-notifications"
        >
          {hasUnread ? (
            <BellDot size={20} className="text-primary" />
          ) : (
            <Bell size={20} />
          )}
          {hasUnread && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 px-1 py-0 text-xs h-5 min-w-5"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirimlerim</span>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLocation('/notifications');
                  setIsOpen(false);
                }}
                className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                data-testid="button-view-all-notifications-header"
              >
                <Eye size={12} className="mr-1" />
                Tümünü Gör
              </Button>
            )}
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="h-6 px-2 text-xs"
                data-testid="button-mark-all-read"
              >
                <CheckCheck size={12} className="mr-1" />
                Okundu Say
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Yükleniyor...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Henüz bir bildirim bulunmamaktadır.
          </div>
        ) : (
          <ScrollArea className="h-96">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={async () => {
                  // Mark as read if unread
                  if (!notification.isRead) {
                    markAsReadMutation.mutate(notification.id);
                  }
                  
                  // Navigate to inspection if it's an inspection-related notification
                  if (notification.type === 'inspection_assigned' && notification.relatedId) {
                    // Find the assignment related to this inspection
                    try {
                      // Get user assignments to find the specific assignment for this inspection
                      const response = await fetch('/api/user/assignments', {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        },
                      });
                      
                      if (response.ok) {
                        const assignments = await response.json();
                        const assignment = assignments.find((a: any) => a.inspectionId === notification.relatedId);
                        
                        if (assignment) {
                          setLocation(`/live-checklist?assignmentId=${assignment.id}`);
                          setIsOpen(false);
                        }
                      }
                    } catch (error) {
                      console.error('Error navigating to inspection:', error);
                    }
                  }
                }}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium truncate ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                      <span className={`text-xs font-medium ${getNotificationColor(notification.type)}`}>
                        {notification.type === 'inspection_assigned' && 'Denetim Atandı'}
                        {notification.type === 'inspection_completed' && 'Denetim Tamamlandı'}
                        {notification.type === 'inspection_overdue' && 'Süre Doldu'}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}