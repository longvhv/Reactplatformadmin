import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';
import type { UserProfile } from '@/services/profileApi';

interface ProfileCardProps {
  profile: UserProfile;
  onEdit: () => void;
}

export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback className="text-2xl bg-[#6366f1] text-white">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-4 font-semibold">{profile.name}</h3>
          <Badge className="mt-2 bg-[#6366f1] hover:bg-[#4f46e5]">
            {profile.role}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="break-all">{profile.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{profile.phone}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{profile.location}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined {profile.joinDate}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{profile.department} - {profile.position}</span>
          </div>
        </div>

        <Button 
          onClick={onEdit}
          className="w-full bg-[#6366f1] hover:bg-[#4f46e5] gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
}
