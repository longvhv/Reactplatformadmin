/**
 * Profile Info Section Component
 * Main profile information display and editing
 */

import { User, Mail, Phone, MapPin, Calendar, Briefcase, Edit2, Save, X, Camera } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import type { ProfileData } from "../../types/profile";

interface ProfileInfoSectionProps {
  profile: ProfileData;
  editedProfile: ProfileData;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFieldChange: (field: keyof ProfileData, value: string) => void;
}

export function ProfileInfoSection({
  profile,
  editedProfile,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onFieldChange,
}: ProfileInfoSectionProps) {
  const stats = [
    { label: "Dự án", value: "24" },
    { label: "Nhiệm vụ", value: "156" },
    { label: "Hoàn thành", value: "98%" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cập nhật thông tin hồ sơ của bạn
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={onEdit} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Chỉnh sửa
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={onSave} className="gap-2">
              <Save className="w-4 h-4" />
              Lưu
            </Button>
            <Button variant="outline" onClick={onCancel} className="gap-2">
              <X className="w-4 h-4" />
              Hủy
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
              {isEditing && (
                <button className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-xs text-white">Thay đổi</span>
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.position}</p>
              <p className="text-sm text-muted-foreground mt-1">{profile.department}</p>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Giới thiệu</label>
                <Textarea
                  value={editedProfile.bio}
                  onChange={(e) => onFieldChange("bio", e.target.value)}
                  placeholder="Viết vài dòng về bản thân..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            )}

            {!isEditing && profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Personal Information */}
      <Card className="p-6 sm:p-8">
        <h3 className="font-semibold mb-6">Chi tiết thông tin</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Họ và tên
            </label>
            {isEditing ? (
              <Input
                value={editedProfile.name}
                onChange={(e) => onFieldChange("name", e.target.value)}
              />
            ) : (
              <p className="font-medium">{profile.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            {isEditing ? (
              <Input
                type="email"
                value={editedProfile.email}
                onChange={(e) => onFieldChange("email", e.target.value)}
              />
            ) : (
              <p className="font-medium">{profile.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Số điện thoại
            </label>
            {isEditing ? (
              <Input
                value={editedProfile.phone}
                onChange={(e) => onFieldChange("phone", e.target.value)}
              />
            ) : (
              <p className="font-medium">{profile.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Địa điểm
            </label>
            {isEditing ? (
              <Input
                value={editedProfile.location}
                onChange={(e) => onFieldChange("location", e.target.value)}
              />
            ) : (
              <p className="font-medium">{profile.location}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Vị trí
            </label>
            {isEditing ? (
              <Input
                value={editedProfile.position}
                onChange={(e) => onFieldChange("position", e.target.value)}
              />
            ) : (
              <p className="font-medium">{profile.position}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Ngày tham gia
            </label>
            <p className="font-medium">{profile.joinDate}</p>
          </div>
        </div>
      </Card>
    </>
  );
}
