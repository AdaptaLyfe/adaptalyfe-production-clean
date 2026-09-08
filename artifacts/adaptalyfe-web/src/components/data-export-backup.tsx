import { useState } from "react";
import { Download, Upload, Share2, FileText, Database, Calendar, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ExportData {
  personalInfo: boolean;
  emergencyContacts: boolean;
  medications: boolean;
  appointments: boolean;
  dailyTasks: boolean;
  moodEntries: boolean;
  financialData: boolean;
  mealPlans: boolean;
  shoppingLists: boolean;
  personalResources: boolean;
  caregiverInfo: boolean;
  achievements: boolean;
}

interface BackupRestoreProps {
  onClose?: () => void;
}

export function DataExportBackup({ onClose }: BackupRestoreProps) {
  const [exportData, setExportData] = useState<ExportData>({
    personalInfo: true,
    emergencyContacts: true,
    medications: true,
    appointments: true,
    dailyTasks: true,
    moodEntries: true,
    financialData: false, // Sensitive data, off by default
    mealPlans: true,
    shoppingLists: true,
    personalResources: true,
    caregiverInfo: true,
    achievements: true,
  });

  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  const { toast } = useToast();

  // Fetch all user data for export
  const { data: userData } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: emergencyContacts } = useQuery({
    queryKey: ["/api/emergency-contacts"],
  });

  const { data: medications } = useQuery({
    queryKey: ["/api/medications"],
  });

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: dailyTasks } = useQuery({
    queryKey: ["/api/daily-tasks"],
  });

  const { data: moodEntries } = useQuery({
    queryKey: ["/api/mood-entries"],
  });

  const { data: bills } = useQuery({
    queryKey: ["/api/bills"],
  });

  const { data: mealPlans } = useQuery({
    queryKey: ["/api/meal-plans"],
  });

  const { data: shoppingLists } = useQuery({
    queryKey: ["/api/shopping-lists"],
  });

  const { data: personalResources } = useQuery({
    queryKey: ["/api/personal-resources"],
  });

  const collectExportData = () => {
    const data: any = {
      exportDate: new Date().toISOString(),
      exportedBy: userData?.username || 'Unknown User',
    };

    if (exportData.personalInfo && userData) {
      data.personalInfo = {
        username: userData.username,
        email: userData.email,
        createdAt: userData.createdAt,
      };
    }

    if (exportData.emergencyContacts && emergencyContacts) {
      data.emergencyContacts = emergencyContacts;
    }

    if (exportData.medications && medications) {
      data.medications = medications;
    }

    if (exportData.appointments && appointments) {
      data.appointments = appointments;
    }

    if (exportData.dailyTasks && dailyTasks) {
      data.dailyTasks = dailyTasks;
    }

    if (exportData.moodEntries && moodEntries) {
      data.moodEntries = moodEntries;
    }

    if (exportData.financialData && bills) {
      data.financialData = bills;
    }

    if (exportData.mealPlans && mealPlans) {
      data.mealPlans = mealPlans;
    }

    if (exportData.shoppingLists && shoppingLists) {
      data.shoppingLists = shoppingLists;
    }

    if (exportData.personalResources && personalResources) {
      data.personalResources = personalResources;
    }

    return data;
  };

  const exportAsJSON = () => {
    const data = collectExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillbridge-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    const data = collectExportData();
    let csvContent = '';

    // Export each data type as separate CSV sections
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        csvContent += `\n${key.toUpperCase()}\n`;
        if (value.length > 0) {
          const headers = Object.keys(value[0]).join(',');
          csvContent += headers + '\n';
          value.forEach((item: any) => {
            const row = Object.values(item).map(val => 
              typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            ).join(',');
            csvContent += row + '\n';
          });
        }
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillbridge-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    const data = collectExportData();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AdaptaLyfe Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
            h2 { color: #4f46e5; margin-top: 30px; }
            h3 { color: #6b7280; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .emergency { color: #dc2626; font-weight: bold; }
            .medication { background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .appointment { background-color: #dbeafe; padding: 10px; border-radius: 5px; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>AdaptaLyfe Data Export</h1>
          <p><strong>Exported:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>User:</strong> ${userData?.username || 'Unknown'}</p>
          
          ${data.emergencyContacts ? `
            <div class="section">
              <h2 class="emergency">🚨 Emergency Contacts</h2>
              ${data.emergencyContacts.map((contact: any) => `
                <div style="margin: 10px 0; padding: 10px; border: 2px solid #dc2626; border-radius: 5px;">
                  <strong>${contact.name}</strong> (${contact.relationship})<br>
                  📞 <strong>${contact.phoneNumber}</strong><br>
                  ${contact.email ? `📧 ${contact.email}<br>` : ''}
                  ${contact.notes ? `📝 ${contact.notes}` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${data.medications ? `
            <div class="section">
              <h2>💊 Medications</h2>
              ${data.medications.map((med: any) => `
                <div class="medication">
                  <h3>${med.medicationName}</h3>
                  <p><strong>Dosage:</strong> ${med.dosage}</p>
                  <p><strong>Frequency:</strong> ${med.frequency}</p>
                  <p><strong>Instructions:</strong> ${med.instructions || 'None'}</p>
                  ${med.pillColor ? `<p><strong>Appearance:</strong> ${med.pillColor} ${med.pillShape} ${med.pillSize}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${data.appointments ? `
            <div class="section">
              <h2>📅 Appointments</h2>
              ${data.appointments.map((appt: any) => `
                <div class="appointment">
                  <h3>${appt.title}</h3>
                  <p><strong>Date:</strong> ${new Date(appt.appointmentDate).toLocaleDateString()}</p>
                  <p><strong>Provider:</strong> ${appt.provider || 'Not specified'}</p>
                  <p><strong>Location:</strong> ${appt.location || 'Not specified'}</p>
                  ${appt.description ? `<p><strong>Notes:</strong> ${appt.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${data.dailyTasks ? `
            <div class="section">
              <h2>✅ Daily Tasks</h2>
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Time Estimate</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.dailyTasks.map((task: any) => `
                    <tr>
                      <td>${task.title}</td>
                      <td>${task.category}</td>
                      <td>${task.isCompleted ? '✅ Completed' : '⏳ Pending'}</td>
                      <td>${task.estimatedMinutes} min</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated by AdaptaLyfe - Grow with Guidance. Thrive with Confidence.</p>
            <p>This document contains personal information. Please handle with care.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (exportFormat) {
        case 'json':
          exportAsJSON();
          break;
        case 'csv':
          exportAsCSV();
          break;
        case 'pdf':
          exportAsPDF();
          break;
      }
      
      toast({
        title: "Export Successful",
        description: `Your data has been exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupToCloud = async () => {
    // This would integrate with cloud storage APIs
    toast({
      title: "Cloud Backup",
      description: "Cloud backup feature coming soon! For now, please download your data locally.",
    });
  };

  const shareWithCaregiver = async () => {
    const data = collectExportData();
    const shareText = `AdaptaLyfe Data Summary for ${userData?.username}:

Emergency Contacts: ${data.emergencyContacts?.length || 0} contacts
Current Medications: ${data.medications?.length || 0} medications
Upcoming Appointments: ${data.appointments?.filter((a: any) => new Date(a.appointmentDate) > new Date()).length || 0}
Completed Tasks Today: ${data.dailyTasks?.filter((t: any) => t.isCompleted).length || 0}

Exported on: ${new Date().toLocaleDateString()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AdaptaLyfe Data Summary',
          text: shareText,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard",
          description: "Summary copied to clipboard for sharing",
        });
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to Clipboard",
        description: "Summary copied to clipboard for sharing",
      });
    }
  };

  const toggleAll = (checked: boolean) => {
    setExportData(Object.keys(exportData).reduce((acc, key) => ({
      ...acc,
      [key]: checked
    }), {} as ExportData));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Data Export & Backup</h2>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (Complete Data)</SelectItem>
                  <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                  <SelectItem value="pdf">PDF (Print-Friendly)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Data to Include</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleAll(true)}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleAll(false)}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(exportData).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) =>
                        setExportData(prev => ({ ...prev, [key]: !!checked }))
                      }
                    />
                    <label htmlFor={key} className="text-sm">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      {key === 'financialData' && (
                        <span className="text-yellow-600 ml-1">⚠️ Sensitive</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              disabled={isExporting || !Object.values(exportData).some(Boolean)}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={shareWithCaregiver} className="w-full justify-start">
              <Share2 className="w-4 h-4 mr-2" />
              Share Summary with Caregiver
            </Button>

            <Button variant="outline" onClick={handleBackupToCloud} className="w-full justify-start">
              <Database className="w-4 h-4 mr-2" />
              Backup to Cloud
            </Button>

            <Collapsible open={showPrintOptions} onOpenChange={setShowPrintOptions}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Print Options
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPrintOptions ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setExportData({
                      personalInfo: false,
                      emergencyContacts: true,
                      medications: true,
                      appointments: false,
                      dailyTasks: false,
                      moodEntries: false,
                      financialData: false,
                      mealPlans: false,
                      shoppingLists: false,
                      personalResources: false,
                      caregiverInfo: false,
                      achievements: false,
                    });
                    setExportFormat('pdf');
                  }}
                  className="w-full justify-start"
                >
                  🚨 Emergency Info Card
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setExportData({
                      personalInfo: false,
                      emergencyContacts: false,
                      medications: true,
                      appointments: true,
                      dailyTasks: false,
                      moodEntries: false,
                      financialData: false,
                      mealPlans: false,
                      shoppingLists: false,
                      personalResources: false,
                      caregiverInfo: false,
                      achievements: false,
                    });
                    setExportFormat('pdf');
                  }}
                  className="w-full justify-start"
                >
                  💊 Medical Summary
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium">Privacy Note</p>
                  <p>Your data is exported locally to your device. We don't send your personal information to external servers.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}