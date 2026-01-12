import { useLanguage } from '@/providers/LanguageProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import type { UserWithMeta } from '@/hooks/useUsersData';

interface UserListItemProps {
  user: UserWithMeta;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function UserListItem({ user, isSelected, onSelect, onEdit, onDelete }: UserListItemProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
      />

      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white">
          {user.avatar}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {user.firstName} {user.lastName}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{user.email}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-medium">{user.department}</p>
          <p className="text-xs text-muted-foreground">{user.position}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant={user.status === 'active' ? 'default' : 'secondary'}
          className={user.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          {t(`users.${user.status}`)}
        </Badge>

        <Badge variant="outline" className="capitalize">
          {t(`users.${user.role}`)}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
