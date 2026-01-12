import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Users } from 'lucide-react';
import { UserListItem } from './UserListItem';
import type { UserWithMeta } from '@/hooks/useUsersData';

interface UserListProps {
  users: UserWithMeta[];
  selectedUsers: number[];
  onSelectAll: (checked: boolean) => void;
  onSelectUser: (userId: number, checked: boolean) => void;
  onEditUser: (user: UserWithMeta) => void;
  onDeleteUser: (userId: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function UserList({
  users,
  selectedUsers,
  onSelectAll,
  onSelectUser,
  onEditUser,
  onDeleteUser,
  hasFilters,
  onClearFilters,
}: UserListProps) {
  const { t } = useLanguage();

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          {t('users.noUsersFound')}
        </p>
        {hasFilters && (
          <Button
            variant="link"
            onClick={onClearFilters}
            className="mt-2"
          >
            {t('common.clear')} {t('common.filter').toLowerCase()}
          </Button>
        )}
      </div>
    );
  }

  const allSelected = users.length > 0 && selectedUsers.length === users.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 pb-3 border-b">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
        />
        <span className="text-sm font-medium text-muted-foreground">
          {t('common.selectAll')}
        </span>
      </div>

      {users.map((user) => (
        <UserListItem
          key={user.id}
          user={user}
          isSelected={selectedUsers.includes(user.id)}
          onSelect={(checked) => onSelectUser(user.id, checked)}
          onEdit={() => onEditUser(user)}
          onDelete={() => onDeleteUser(user.id)}
        />
      ))}
    </div>
  );
}
