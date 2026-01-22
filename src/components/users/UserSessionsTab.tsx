/**
 * UserSessionsTab Component
 * Manage user's active sessions
 * 
 * ✅ FIXED 2026-01-20: 
 * - Added Create/Edit functionality via UserSessionForm
 * - Full schema compliance
 */

import { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Trash2,
  CheckCircle,
  AlertCircle,
  MapPin,
  Plus,
  Edit,
  Shield,
  HelpCircle,
  Tv,
  Watch
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { userSessionsApi, type UserSession, DeviceTypeHelper, DeviceType } from '../../api/userSessionsApi';
import { UserSessionForm } from '../sessions/UserSessionForm';
import { toast } from 'sonner';

interface UserSessionsTabProps {
  userId: string;
}

export function UserSessionsTab({ userId }: UserSessionsTabProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<UserSession | null>(null);

  useEffect(() => {
    if (userId) fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await userSessionsApi.getByUserId(userId);
      setSessions(data);
    } catch (error) {
      console.error('❌ [UserSessionsTab] Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;

    try {
      await userSessionsApi.revokeSession(sessionId);
      toast.success('Session revoked');
      await fetchSessions();
    } catch (error) {
      console.error('❌ [UserSessionsTab] Error revoking session:', error);
      toast.error('Failed to revoke session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to DELETE this session? This cannot be undone.')) return;

    try {
      await userSessionsApi.delete(sessionId);
      toast.success('Session deleted');
      await fetchSessions();
    } catch (error) {
      console.error('❌ [UserSessionsTab] Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const getDeviceIcon = (deviceType?: string | null) => {
    if (!deviceType) return Monitor;
    const type = deviceType as DeviceType;
    if (DeviceTypeHelper.isMobile(type)) return Smartphone;
    if (DeviceTypeHelper.isTablet(type)) return Tablet;
    if (DeviceTypeHelper.isSmartTV(type)) return Tv;
    if (DeviceTypeHelper.isWatch(type)) return Watch;
    if (DeviceTypeHelper.isOther(type)) return HelpCircle;
    return Monitor;
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Sessions</h2>
          <p className="text-sm text-gray-500">
            Manage active login sessions and device access
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <UserSessionForm 
              userId={userId}
              onSuccess={() => {
                setIsCreateOpen(false);
                fetchSessions();
              }}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter((s) => s.is_active).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Monitor className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter((s) => {
                  if (!s.expires_at) return false;
                  const hoursLeft = (new Date(s.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
                  return hoursLeft < 24 && hoursLeft > 0;
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sessions List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device / Token</TableHead>
              <TableHead>Location / IP</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device_type);
                const isExpiringSoon = session.expires_at 
                  ? (new Date(session.expires_at).getTime() - Date.now()) / (1000 * 60 * 60) < 24
                  : false;

                return (
                  <TableRow key={session._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-50">
                          <DeviceIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {session.device_name || session.browser || 'Unknown Device'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]" title={session.session_token}>
                            {session.session_token.substring(0, 12)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-mono text-gray-900">
                            {session.ip_address || '-'}
                          </p>
                          {session.location && (
                            <p className="text-xs text-gray-500">{session.location}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {session.is_active ? (
                        <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        {session.last_activity_at 
                          ? formatTimeAgo(session.last_activity_at)
                          : '-'
                        }
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">
                          {session.expires_at 
                            ? new Date(session.expires_at).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                        {isExpiringSoon && session.is_active && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs mt-1">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Expiring
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSession(session)}
                          title="Edit Session"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        
                        {session.is_active ? (
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevokeSession(session._id)}
                            title="Revoke Session"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSession(session._id)}
                            title="Delete Permanently"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingSession && (
             <UserSessionForm 
              initialData={editingSession}
              isEdit={true}
              onSuccess={() => {
                setEditingSession(null);
                fetchSessions();
              }}
              onCancel={() => setEditingSession(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}