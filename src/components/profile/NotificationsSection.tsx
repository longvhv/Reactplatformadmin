/**
 * Notifications Section Component
 * Email and push notification settings
 */

import { Card } from "../ui/card";
import { EMAIL_NOTIFICATION_SETTINGS, PUSH_NOTIFICATION_SETTINGS } from "../../constants/profile";

export function NotificationsSection() {
  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Thông báo</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cài đặt cách bạn nhận thông báo
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <h3 className="font-semibold mb-6">Thông báo Email</h3>
        <div className="space-y-4">
          {EMAIL_NOTIFICATION_SETTINGS.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h3 className="font-semibold mb-6">Thông báo Push</h3>
        <div className="space-y-4">
          {PUSH_NOTIFICATION_SETTINGS.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
