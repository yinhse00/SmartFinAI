import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Bell, 
  Settings,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { 
  executionCollaborationService, 
  ProjectMember, 
  ExecutionNotification,
  ExecutionRole 
} from '@/services/execution/executionCollaborationService';
import { useToast } from '@/hooks/use-toast';

interface ExecutionCollaborationPanelProps {
  projectId: string;
  currentUserRole?: ExecutionRole;
}

export const ExecutionCollaborationPanel = ({ 
  projectId, 
  currentUserRole = 'team_member' 
}: ExecutionCollaborationPanelProps) => {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [notifications, setNotifications] = useState<ExecutionNotification[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ExecutionRole>('team_member');
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
    loadNotifications();
  }, [projectId]);

  const loadMembers = async () => {
    try {
      const membersList = await executionCollaborationService.getProjectMembers(projectId);
      setMembers(membersList);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const notificationsList = await executionCollaborationService.getUserNotifications(20);
      const projectNotifications = notificationsList.filter(n => n.project_id === projectId);
      setNotifications(projectNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleInviteMember = async () => {
    if (!newMemberEmail.trim()) return;

    setIsInviting(true);
    try {
      await executionCollaborationService.inviteMember(
        projectId,
        newMemberEmail.trim(),
        newMemberRole,
        getDefaultPermissions(newMemberRole)
      );

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newMemberEmail}`
      });

      setNewMemberEmail('');
      await loadMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Invitation Failed",
        description: "Could not send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await executionCollaborationService.removeMember(projectId, memberId);
      toast({
        title: "Member Removed",
        description: "Member has been removed from the project"
      });
      await loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Could not remove member",
        variant: "destructive"
      });
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: ExecutionRole) => {
    try {
      await executionCollaborationService.updateMemberRole(
        projectId,
        memberId,
        role,
        getDefaultPermissions(role)
      );
      toast({
        title: "Role Updated",
        description: "Member role has been updated"
      });
      await loadMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Could not update member role",
        variant: "destructive"
      });
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await executionCollaborationService.markNotificationRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const getDefaultPermissions = (role: ExecutionRole): Record<string, boolean> => {
    switch (role) {
      case 'admin':
        return {
          manage_members: true,
          edit_tasks: true,
          view_all: true,
          manage_project: true
        };
      case 'manager':
        return {
          manage_members: false,
          edit_tasks: true,
          view_all: true,
          manage_project: false
        };
      case 'external_advisor':
        return {
          manage_members: false,
          edit_tasks: false,
          view_all: true,
          manage_project: false
        };
      default:
        return {
          manage_members: false,
          edit_tasks: true,
          view_all: false,
          manage_project: false
        };
    }
  };

  const getRoleColor = (role: ExecutionRole): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'external_advisor': return 'bg-purple-100 text-purple-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const canManageMembers = currentUserRole === 'admin' || currentUserRole === 'manager';

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Project Collaboration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Alerts ({notifications.filter(n => !n.read_at).length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4 mt-4">
            {canManageMembers && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Team Member
                </h4>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="flex-1"
                  />
                  <select 
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as ExecutionRole)}
                    className="px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="team_member">Team Member</option>
                    <option value="manager">Manager</option>
                    <option value="external_advisor">External Advisor</option>
                    <option value="client">Client</option>
                  </select>
                  <Button 
                    onClick={handleInviteMember} 
                    disabled={isInviting || !newMemberEmail.trim()}
                    size="sm"
                  >
                    {isInviting ? 'Inviting...' : 'Invite'}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(member.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.email}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getStatusIcon(member.status)}
                        <span className="capitalize">{member.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(member.role)}>
                      {member.role.replace('_', ' ')}
                    </Badge>
                    {canManageMembers && member.status === 'active' && (
                      <div className="flex gap-1">
                        <select 
                          value={member.role}
                          onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as ExecutionRole)}
                          className="text-xs px-2 py-1 border rounded"
                        >
                          <option value="team_member">Team Member</option>
                          <option value="manager">Manager</option>
                          <option value="external_advisor">External Advisor</option>
                          <option value="client">Client</option>
                        </select>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3 mt-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      notification.read_at ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => !notification.read_at && markNotificationRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{notification.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Project Permissions</h4>
                <div className="text-sm text-gray-600">
                  <p>Your current role: <Badge className={getRoleColor(currentUserRole)}>{currentUserRole.replace('_', ' ')}</Badge></p>
                  <p className="mt-2">Available permissions based on your role:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {getDefaultPermissions(currentUserRole).manage_members && <li>Manage team members</li>}
                    {getDefaultPermissions(currentUserRole).edit_tasks && <li>Edit tasks and status</li>}
                    {getDefaultPermissions(currentUserRole).view_all && <li>View all project data</li>}
                    {getDefaultPermissions(currentUserRole).manage_project && <li>Manage project settings</li>}
                  </ul>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Notification Preferences</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Email notifications for task updates</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Email notifications for new comments</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Email notifications for project risks</span>
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};