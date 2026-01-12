import { useLanguage } from '@/providers/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Profile } from '@/types/profile';

export function ProfileInfo({ profile }: { profile: Profile }) {
  const { t } = useLanguage();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{t('profile.personalInformation')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('common.fullName')}</Label>
            <p className="font-medium">{profile.name}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('profile.email')}</Label>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('profile.phone')}</Label>
            <p className="font-medium">{profile.phone}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('profile.location')}</Label>
            <p className="font-medium">{profile.location}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('profile.department')}</Label>
            <p className="font-medium">{profile.department}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('profile.position')}</Label>
            <p className="font-medium">{profile.position}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}