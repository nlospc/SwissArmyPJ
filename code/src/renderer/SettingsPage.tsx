import { useState } from 'react';
import { SunIcon, CogIcon, UserIcon, InboxIcon } from './icons';

type Tab = 'general' | 'workspace' | 'inbox' | 'profile';

const TABS = [
  { id: 'general' as Tab, label: 'General', icon: CogIcon },
  { id: 'workspace' as Tab, label: 'Workspace', icon: SunIcon },
  { id: 'inbox' as Tab, label: 'Inbox', icon: InboxIcon },
  { id: 'profile' as Tab, label: 'Profile', icon: UserIcon },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [desktopNotifications, setDesktopNotifications] = useState(true);

  const TabIcon = TABS.find(t => t.id === activeTab)?.icon || CogIcon;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="section-title mb-1">Settings</h1>
        <p className="section-subtitle">
          Manage your workspace and application preferences
        </p>
      </div>

      <div className="flex gap-6 flex-1 overflow-auto">
        {/* Sidebar Tabs */}
        <div className="flex-shrink-0 w-[380px]">
          <div className="flex flex-col gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Appearance */}
              <div className="card">
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Appearance
                </h2>

                {/* Theme Selection */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-text-primary">
                      Theme
                    </label>
                    <p className="text-sm text-text-tertiary mt-0.5">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTheme('light')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'light'
                          ? 'bg-primary text-white'
                          : 'bg-white text-text-secondary border border-border hover:border-primary/50'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-primary text-white'
                          : 'bg-white text-text-secondary border border-border hover:border-primary/50'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'system'
                          ? 'bg-primary text-white'
                          : 'bg-white text-text-secondary border border-border hover:border-primary/50'
                      }`}
                    >
                      System
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="card">
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Notifications
                </h2>

                {/* Desktop Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-text-primary">
                      Show Desktop Notifications
                    </label>
                    <p className="text-sm text-text-tertiary mt-0.5">
                      Get notified when files are processed
                    </p>
                  </div>
                  <button
                    onClick={() => setDesktopNotifications(!desktopNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      desktopNotifications ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="card">
              <div className="text-center py-12">
                <TabIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  Workspace Settings
                </h2>
                <p className="text-sm text-text-tertiary">
                  Customize your workspace preferences and integrations
                </p>
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="card">
              <div className="text-center py-12">
                <TabIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  Inbox Settings
                </h2>
                <p className="text-sm text-text-tertiary">
                  Configure file import preferences and automation rules
                </p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card">
              <div className="text-center py-12">
                <TabIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  Profile Settings
                </h2>
                <p className="text-sm text-text-tertiary">
                  Update your personal information and account settings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
