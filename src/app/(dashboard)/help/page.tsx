'use client';

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/providers/LanguageProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Book, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const helpResources = [
    {
      title: t('help.documentation'),
      description: t('help.documentationDescription'),
      icon: Book,
      link: '/docs',
      external: false,
    },
    {
      title: t('help.community'),
      description: t('help.communityDescription'),
      icon: MessageCircle,
      link: '/community',
      external: false,
    },
    {
      title: t('help.contactSupport'),
      description: t('help.contactSupportDescription'),
      icon: Mail,
      link: 'mailto:support@example.com',
      external: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('help.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('help.subtitle')}
        </p>
      </div>

      {/* Navigation Test */}
      <Card>
        <CardHeader>
          <CardTitle>{t('help.navigationTest')}</CardTitle>
          <CardDescription>
            {t('help.navigationTestDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>{t('help.goToDashboard')}</Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>{t('help.goToSettings')}</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {t('help.navigationSuccess')}
          </p>
        </CardContent>
      </Card>

      {/* Help Resources */}
      <div className="grid gap-6 md:grid-cols-3">
        {helpResources.map((resource) => {
          const Icon = resource.icon;
          return (
            <Card key={resource.title} className="hover:border-[#6366f1] transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-[#6366f1]/10 rounded-lg">
                    <Icon className="h-5 w-5 text-[#6366f1]" />
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {resource.description}
                </p>
                {resource.external ? (
                  <a
                    href={resource.link}
                    className="inline-flex items-center text-sm font-medium text-[#6366f1] hover:underline"
                  >
                    {t('common.visit')}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                ) : (
                  <button
                    onClick={() => navigate(resource.link)}
                    className="inline-flex items-center text-sm font-medium text-[#6366f1] hover:underline"
                  >
                    {t('common.visit')}
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('help.faq')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">{t('help.faqLanguageQuestion')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('help.faqLanguageAnswer')}
            </p>
          </div>
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">{t('help.faqThemeQuestion')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('help.faqThemeAnswer')}
            </p>
          </div>
          <div className="pb-4">
            <h3 className="font-medium mb-2">{t('help.faqProfileQuestion')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('help.faqProfileAnswer')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}