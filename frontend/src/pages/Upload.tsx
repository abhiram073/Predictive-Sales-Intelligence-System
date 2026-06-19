import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

export default function UploadData() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { token, user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/api/v1/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setStatus('success');
      setMessage(res.data.message || 'File uploaded successfully and processing started.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'Error uploading file.');
    }
  };

  if (user?.role !== 'Admin' && user?.role !== 'Manager') {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2 border border-destructive/20">
          <AlertTriangle className="h-5 w-5" />
          <span>You do not have permission to upload data. Only Admins and Managers can perform this action.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Data Ingestion</h1>
      <p className="text-muted-foreground mb-8">Upload historical sales data (CSV/Excel) to update the forecasting models.</p>

      <div className="border-2 border-dashed border-border rounded-xl p-12 bg-card flex flex-col items-center justify-center transition-colors hover:border-primary/50">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
          <UploadCloud className="h-10 w-10" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-foreground">Select File to Upload</h3>
        <p className="text-sm text-muted-foreground mb-8 max-w-md text-center">
          Supported formats: .csv, .xls, .xlsx. Required columns: sku, name, category, price, date, units_sold, revenue.
        </p>

        <label className="cursor-pointer bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all shadow-sm">
          Browse Files
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </label>

        {file && (
          <div className="mt-6 px-4 py-2 bg-secondary rounded-md text-sm font-medium text-secondary-foreground border border-border">
            Selected: {file.name}
          </div>
        )}

        {file && status !== 'uploading' && status !== 'success' && (
          <button 
            onClick={handleUpload}
            className="mt-6 px-8 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg font-medium transition-all shadow-sm"
          >
            Upload and Process Data
          </button>
        )}

        {status === 'uploading' && (
          <div className="mt-6 flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Uploading to server...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 flex items-center gap-2 text-green-600 font-medium bg-green-500/10 px-4 py-2 rounded-md border border-green-500/20">
            <CheckCircle className="h-5 w-5" />
            {message}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 flex items-center gap-2 text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-md border border-destructive/20">
            <AlertTriangle className="h-5 w-5" />
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
