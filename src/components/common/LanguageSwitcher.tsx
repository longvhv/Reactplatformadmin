/**
 * LanguageSwitcher Component
 * Dropdown to switch between languages
 */

import { Check, Languages, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { useLanguage } from '../../providers/LanguageProvider';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 hover:scale-105 active:scale-95 transition-all duration-150 group"
        >
          <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
          <span className="hidden lg:inline text-sm">{currentLanguage?.nativeName}</span>
          <span className="text-base lg:hidden group-hover:scale-110 transition-transform duration-200">
            {currentLanguage?.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Languages className="w-3.5 h-3.5" />
          Select Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center justify-between cursor-pointer transition-all duration-150 ${
              language === lang.code 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{lang.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm">{lang.nativeName}</span>
                <span className="text-xs text-muted-foreground">{lang.name}</span>
              </div>
            </div>
            {language === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}