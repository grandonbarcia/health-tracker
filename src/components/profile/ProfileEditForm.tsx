'use client';

import { useState } from 'react';
import {
  UserProfileInput,
  PRIMARY_GOAL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  INTEREST_OPTIONS,
  PrimaryGoal,
  ActivityLevel,
} from '@/types/profile';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Save,
  X,
  Eye,
  EyeOff,
  MapPin,
  Target,
  Scale,
  Ruler,
  Loader2,
} from 'lucide-react';

interface ProfileEditFormProps {
  initialData?: Partial<UserProfileInput>;
  onSave: (data: UserProfileInput) => Promise<void>;
  onCancel?: () => void;
  isCreating?: boolean;
}

export function ProfileEditForm({
  initialData = {},
  onSave,
  onCancel,
  isCreating = false,
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState<UserProfileInput>({
    username: initialData.username || '',
    display_name: initialData.display_name || '',
    bio: initialData.bio || '',
    date_of_birth: initialData.date_of_birth || '',
    gender: initialData.gender || '',
    height_cm: initialData.height_cm || undefined,
    current_weight_lbs: initialData.current_weight_lbs || undefined,
    target_weight_lbs: initialData.target_weight_lbs || undefined,
    primary_goal: initialData.primary_goal || undefined,
    activity_level: initialData.activity_level || undefined,
    dietary_preferences: initialData.dietary_preferences || [],
    location: initialData.location || '',
    interests: initialData.interests || [],
    is_public: initialData.is_public ?? false,
    allow_friend_requests: initialData.allow_friend_requests ?? true,
    show_on_leaderboards: initialData.show_on_leaderboards ?? true,
    show_weight: initialData.show_weight ?? false,
    show_nutrition: initialData.show_nutrition ?? true,
    show_workouts: initialData.show_workouts ?? true,
    show_vitals: initialData.show_vitals ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    'basic' | 'health' | 'social' | 'privacy'
  >('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (
    array: string[],
    item: string,
    setter: (arr: string[]) => void
  ) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'health', label: 'Health & Goals', icon: Target },
    { id: 'social', label: 'Social', icon: MapPin },
    { id: 'privacy', label: 'Privacy', icon: Eye },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {/* Section Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((section) => (
          <Button
            key={section.id}
            type="button"
            variant={activeSection === section.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection(section.id as any)}
            className="flex-shrink-0"
          >
            <section.icon className="w-4 h-4 mr-2" />
            {section.label}
          </Button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Info Section */}
      {activeSection === 'basic' && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tell others about yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Username *
              </label>
              <input
                type="text"
                value={formData.username || ''}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-background"
                placeholder="your_username"
                pattern="^[a-zA-Z][a-zA-Z0-9_]{2,29}$"
                required={isCreating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                3-30 characters, letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-background"
                placeholder="Your Name"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
                placeholder="Tell us about your health journey..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.bio?.length || 0}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health & Goals Section */}
      {activeSection === 'health' && (
        <Card>
          <CardHeader>
            <CardTitle>Health & Goals</CardTitle>
            <CardDescription>
              Help us personalize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height_cm || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      height_cm: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="170"
                  min="50"
                  max="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Current Weight (lbs)
                </label>
                <input
                  type="number"
                  value={formData.current_weight_lbs || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_weight_lbs:
                        parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="150"
                  min="50"
                  max="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Target className="w-4 h-4 inline mr-1" />
                  Target Weight (lbs)
                </label>
                <input
                  type="number"
                  value={formData.target_weight_lbs || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_weight_lbs:
                        parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="140"
                  min="50"
                  max="1000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Goal
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PRIMARY_GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, primary_goal: goal.value })
                    }
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      formData.primary_goal === goal.value
                        ? 'border-primary bg-primary/10'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium">{goal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Activity Level
              </label>
              <div className="space-y-2">
                {ACTIVITY_LEVEL_OPTIONS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, activity_level: level.value })
                    }
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      formData.activity_level === level.value
                        ? 'border-primary bg-primary/10'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium">{level.label}</span>
                    <p className="text-sm text-muted-foreground">
                      {level.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Dietary Preferences
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_PREFERENCE_OPTIONS.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() =>
                      toggleArrayItem(
                        formData.dietary_preferences || [],
                        pref,
                        (arr) =>
                          setFormData({ ...formData, dietary_preferences: arr })
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.dietary_preferences?.includes(pref)
                        ? 'bg-green-500 text-white'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Section */}
      {activeSection === 'social' && (
        <Card>
          <CardHeader>
            <CardTitle>Social & Discovery</CardTitle>
            <CardDescription>
              Connect with others who share your interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-background"
                placeholder="City, Country"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() =>
                      toggleArrayItem(
                        formData.interests || [],
                        interest,
                        (arr) => setFormData({ ...formData, interests: arr })
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.interests?.includes(interest)
                        ? 'bg-blue-500 text-white'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Section */}
      {activeSection === 'privacy' && (
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Control what others can see</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleSetting
              label="Public Profile"
              description="Allow anyone to find and view your profile"
              checked={formData.is_public ?? false}
              onChange={(checked) =>
                setFormData({ ...formData, is_public: checked })
              }
            />

            <ToggleSetting
              label="Allow Friend Requests"
              description="Let others send you connection requests"
              checked={formData.allow_friend_requests ?? true}
              onChange={(checked) =>
                setFormData({ ...formData, allow_friend_requests: checked })
              }
            />

            <ToggleSetting
              label="Show on Leaderboards"
              description="Appear in community rankings"
              checked={formData.show_on_leaderboards ?? true}
              onChange={(checked) =>
                setFormData({ ...formData, show_on_leaderboards: checked })
              }
            />

            <hr className="my-4" />
            <p className="text-sm font-medium text-muted-foreground">
              What others can see on your profile:
            </p>

            <ToggleSetting
              label="Show Weight"
              description="Display your weight on your profile"
              checked={formData.show_weight ?? false}
              onChange={(checked) =>
                setFormData({ ...formData, show_weight: checked })
              }
            />

            <ToggleSetting
              label="Show Nutrition Stats"
              description="Display your nutrition tracking stats"
              checked={formData.show_nutrition ?? true}
              onChange={(checked) =>
                setFormData({ ...formData, show_nutrition: checked })
              }
            />

            <ToggleSetting
              label="Show Workout Stats"
              description="Display your workout activity"
              checked={formData.show_workouts ?? true}
              onChange={(checked) =>
                setFormData({ ...formData, show_workouts: checked })
              }
            />

            <ToggleSetting
              label="Show Vital Signs"
              description="Display your health vitals"
              checked={formData.show_vitals ?? false}
              onChange={(checked) =>
                setFormData({ ...formData, show_vitals: checked })
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? 'Create Profile' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  );
}

export default ProfileEditForm;
