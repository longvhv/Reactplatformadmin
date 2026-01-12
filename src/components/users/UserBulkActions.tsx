import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';

interface UserBulkActionsProps {
  selectedCount: number;
  onExport: () => void;
  onDelete: () => void;
}

export function UserBulkActions({ selectedCount, onExport, onDelete }: UserBulkActionsProps) {
  const { t } = useLanguage();

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-4 p-3 bg-[#6366f1]/5 border border-[#6366f1]/20 rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} {t('users.selectedUsers')}
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {t('users.exportSelected')}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {t('users.deleteSelected')}
        </Button>
      </div>
    </div>
  );
}
