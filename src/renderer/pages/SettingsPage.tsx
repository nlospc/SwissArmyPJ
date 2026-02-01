import React, { useState } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { ipc } from '@/lib/ipc';
import { loadSampleData } from '@/lib/sampleData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function SettingsPage() {
  const { workspace, updateWorkspaceName } = useWorkspaceStore();
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    await updateWorkspaceName(workspaceName);
    setMessage({ type: 'success', text: 'Workspace name updated successfully' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = async () => {
    const result = await ipc.settings.export();
    if (result.success && result.data) {
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `swissarmypm-export-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      setMessage({ type: 'success', text: 'Data exported successfully' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await ipc.settings.import(data);

      if (result.success) {
        setMessage({ type: 'success', text: 'Data imported successfully. Please reload the page.' });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to import data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid import file' });
    }
  };

  const handleResetToSampleData = async () => {
    try {
      // Clear existing data by importing empty data
      await ipc.settings.import({
        portfolios: [],
        projects: [],
        work_items: [],
        inbox_items: [],
        todos: [],
        settings: [],
      });

      // Load sample data
      await loadSampleData();

      setMessage({ type: 'success', text: 'Sample data loaded. Reloading page...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset data' });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace and data</p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Configure your workspace settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Workspace"
              />
              <Button onClick={handleUpdateWorkspace}>Update</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export, import, or reset your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Export Data</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Download all your data as a JSON file
            </p>
            <Button onClick={handleExport} variant="outline">
              Export Data
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Import Data</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Import data from a previously exported JSON file
            </p>
            <Input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="max-w-md"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Reset to Sample Data</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Clear all data and reload sample projects and work items
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Reset to Sample Data</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will delete ALL your current data and replace it with sample data.
                    This action cannot be undone. Make sure to export your data first if you want to keep it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToSampleData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, reset to sample data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-medium">Electron + SQLite</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
