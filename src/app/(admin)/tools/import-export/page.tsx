/**
 * Import/Export Tools Page
 * ✅ MIGRATED from /pages/tools/import-export.tsx
 */
'use client';
import { Fragment, useState } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { importExportApi } from '@/api/importExportApi';
import { showToast } from '@/lib/toast';

function ImportExportPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: string) => {
    try {
      setExporting(true);
      await importExportApi.export(format);
      showToast.success('Success', `Exporting data as ${format}...`);
    } catch (error: any) {
      showToast.error('Error', 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setImporting(true);
      await importExportApi.import(file);
      showToast.success('Success', 'Data imported successfully');
    } catch (error: any) {
      showToast.error('Error', 'Failed to import');
    } finally {
      setImporting(false);
    }
  };

  return <Fragment><PageLayout icon={FileText} title="Import/Export" description="Import and export data"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Card className="p-6"><h3 className="text-lg font-semibold mb-4 flex items-center"><Download className="w-5 h-5 mr-2" />Export Data</h3><p className="text-sm text-gray-500 mb-4">Export your data in various formats</p><div className="space-y-2"><Button className="w-full" onClick={() => handleExport('csv')} disabled={exporting}><Download className="w-4 h-4 mr-2" />Export as CSV</Button><Button className="w-full" onClick={() => handleExport('json')} disabled={exporting}><Download className="w-4 h-4 mr-2" />Export as JSON</Button><Button className="w-full" onClick={() => handleExport('xlsx')} disabled={exporting}><Download className="w-4 h-4 mr-2" />Export as Excel</Button></div></Card><Card className="p-6"><h3 className="text-lg font-semibold mb-4 flex items-center"><Upload className="w-5 h-5 mr-2" />Import Data</h3><p className="text-sm text-gray-500 mb-4">Import data from supported file formats</p><div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"><Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" /><p className="text-sm text-gray-500 mb-4">Drag and drop or click to select file</p><input type="file" accept=".csv,.json,.xlsx" onChange={(e) => e.target.files && handleImport(e.target.files[0])} className="hidden" id="file-input" /><Button onClick={() => document.getElementById('file-input')?.click()} disabled={importing}>{importing ? 'Importing...' : 'Select File'}</Button></div></Card></div></PageLayout></Fragment>;
}
export { ImportExportPage };
export default ImportExportPage;
