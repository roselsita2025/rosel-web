import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Trash2, 
  Upload, 
  Database, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  HardDrive,
  Shield,
  Eye
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout.jsx';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BackupRestorePage = () => {
  const [backups, setBackups] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [restorePreview, setRestorePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupStats, setBackupStats] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/backup/list`);
      if (response.data.success) {
        setBackups(response.data.backups);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Failed to fetch backups');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBackup = async () => {
    try {
      setIsGenerating(true);
      const response = await axios.get(`${API_URL}/backup/generate`);
      
      if (response.data.success) {
        toast.success(`Backup generated successfully! (${response.data.fileSize} KB)`);
        fetchBackups(); // Refresh the list
      }
    } catch (error) {
      console.error('Error generating backup:', error);
      toast.error('Failed to generate backup');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadBackup = async (filename) => {
    try {
      const response = await axios.get(`${API_URL}/backup/download/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    }
  };

  const deleteBackup = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/backup/delete/${filename}`);
      
      if (response.data.success) {
        toast.success('Backup deleted successfully');
        fetchBackups(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a valid JSON backup file');
      return;
    }

    try {
      setIsUploading(true);
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);
      
      if (!backupData.metadata || !backupData.data) {
        throw new Error('Invalid backup file format');
      }

      setSelectedFile({ name: file.name, data: backupData });
      toast.success('Backup file loaded successfully');
    } catch (error) {
      console.error('Error loading backup file:', error);
      toast.error('Invalid backup file format');
    } finally {
      setIsUploading(false);
    }
  };

  const previewRestore = async () => {
    if (!selectedFile) {
      toast.error('Please select a backup file first');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/backup/restore/preview`, {
        backupData: selectedFile.data
      });
      
      if (response.data.success) {
        setRestorePreview(response.data.preview);
        toast.success('Restore preview generated');
      }
    } catch (error) {
      console.error('Error generating restore preview:', error);
      toast.error('Failed to generate restore preview');
    }
  };

  const executeRestore = async () => {
    if (!selectedFile || !restorePreview) {
      toast.error('Please preview the restore first');
      return;
    }

    if (!window.confirm('WARNING: This will replace ALL current data with the backup data. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    try {
      setIsRestoring(true);
      const response = await axios.post(`${API_URL}/backup/restore/execute`, {
        backupData: selectedFile.data,
        confirmReplace: true
      });
      
      if (response.data.success) {
        toast.success('Restore completed successfully!');
        setRestorePreview(null);
        setSelectedFile(null);
        fetchBackups(); // Refresh backups list
      }
    } catch (error) {
      console.error('Error executing restore:', error);
      toast.error('Failed to execute restore');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatFileSize = (sizeInKB) => {
    if (sizeInKB < 1024) return `${sizeInKB} KB`;
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const fetchBackupStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await axios.get(`${API_URL}/backup/stats`);
      if (response.data.success) {
        setBackupStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching backup stats:', error);
      toast.error('Failed to fetch backup statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const validateBackupFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a backup file first');
      return;
    }

    try {
      setIsValidating(true);
      const response = await axios.post(`${API_URL}/backup/validate`, {
        backupData: selectedFile.data
      });
      
      if (response.data.success) {
        setValidationResult(response.data);
        toast.success('Backup validation completed');
      }
    } catch (error) {
      console.error('Error validating backup:', error);
      toast.error('Failed to validate backup');
    } finally {
      setIsValidating(false);
    }
  };

  const cleanupOldBackups = async (keepCount = 10) => {
    if (!window.confirm(`This will delete old backups, keeping only the most recent ${keepCount} backups. Continue?`)) {
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/backup/cleanup`, {
        keepCount
      });
      
      if (response.data.success) {
        toast.success(`Cleanup completed. Deleted ${response.data.deletedCount} old backups.`);
        fetchBackups(); // Refresh the list
        fetchBackupStats(); // Refresh statistics
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      toast.error('Failed to cleanup old backups');
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchBackupStats();
  }, []);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Backup & Restore</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage database backups and restore operations</p>
        </motion.div>

        {/* Statistics Dashboard */}
        {backupStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 sm:mb-8 bg-white rounded-lg shadow-md p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Backup Statistics</h2>
              </div>
              <button
                onClick={fetchBackupStats}
                disabled={isLoadingStats}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 active:scale-95"
                title="Refresh statistics"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Database className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-600">Total Backups</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">{backupStats.totalBackups}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <HardDrive className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-green-600">Total Size</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-900 truncate">
                      {backupStats.totalSize > 1024 * 1024 
                        ? `${(backupStats.totalSize / (1024 * 1024)).toFixed(1)} MB`
                        : `${(backupStats.totalSize / 1024).toFixed(1)} KB`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-purple-600">Total Records</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">{backupStats.totalRecords.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-orange-600">Average Size</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-900 truncate">
                      {backupStats.averageSize > 1024 
                        ? `${(backupStats.averageSize / 1024).toFixed(1)} MB`
                        : `${backupStats.averageSize} KB`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {backupStats.totalBackups > 0 && (
              <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 md:col-span-2">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Collection Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-blue-600">{backupStats.collections.products}</p>
                      <p className="text-xs text-gray-600">Products</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-green-600">{backupStats.collections.orders}</p>
                      <p className="text-xs text-gray-600">Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-purple-600">{backupStats.collections.users}</p>
                      <p className="text-xs text-gray-600">Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-orange-600">{backupStats.collections.reviews}</p>
                      <p className="text-xs text-gray-600">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-pink-600">{backupStats.collections.transactions || 0}</p>
                      <p className="text-xs text-gray-600">Transactions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-indigo-600">{backupStats.collections.coupons || 0}</p>
                      <p className="text-xs text-gray-600">Coupons</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-red-600">{backupStats.collections.notifications || 0}</p>
                      <p className="text-xs text-gray-600">Notifications</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-yellow-600">{backupStats.collections.activityLogs || 0}</p>
                      <p className="text-xs text-gray-600">Activity Logs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-teal-600">{backupStats.collections.replacementRequests || 0}</p>
                      <p className="text-xs text-gray-600">Replacements</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-cyan-600">{backupStats.collections.chats || 0}</p>
                      <p className="text-xs text-gray-600">Chats</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-lime-600">{backupStats.collections.messages || 0}</p>
                      <p className="text-xs text-gray-600">Messages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-amber-600">{backupStats.collections.faqs || 0}</p>
                      <p className="text-xs text-gray-600">FAQs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-rose-600">{backupStats.collections.writeOffs || 0}</p>
                      <p className="text-xs text-gray-600">Write-Offs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-emerald-600">{backupStats.collections.purchaseOrders || 0}</p>
                      <p className="text-xs text-gray-600">Purchase Orders</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Backup Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-xs sm:text-sm text-gray-600">Oldest Backup:</span>
                      <span className="text-xs sm:text-sm font-medium break-words">
                        {backupStats.oldestBackup ? formatDate(backupStats.oldestBackup) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-xs sm:text-sm text-gray-600">Newest Backup:</span>
                      <span className="text-xs sm:text-sm font-medium break-words">
                        {backupStats.newestBackup ? formatDate(backupStats.newestBackup) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {backupStats.totalBackups > 10 && (
              <div className="mt-4 sm:mt-6 flex justify-center sm:justify-end">
                <button
                  onClick={() => cleanupOldBackups(10)}
                  className="bg-red-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-700 active:bg-red-700 transition-colors duration-200 flex items-center active:scale-95 w-full sm:w-auto justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cleanup Old Backups
                </button>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Generate Backup Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Generate Backup</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              Create a complete backup of all database collections including products (with weight options, barcodes, and expiration dates), purchase orders, orders, users, reviews, transactions, coupons, notifications, activity logs, replacement requests, chats, messages, FAQs, and write-offs.
            </p>
            <button
              onClick={generateBackup}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-lg hover:bg-blue-700 active:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  <span className="whitespace-nowrap">Generating Backup...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="whitespace-nowrap">Generate New Backup</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Restore Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Restore from Backup</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              Upload a backup file to restore your database to a previous state.
            </p>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Select Backup File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              {selectedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-green-800 font-medium truncate">{selectedFile.name}</span>
                  </div>
                  <p className="text-green-600 text-xs sm:text-sm mt-1">
                    Backup loaded successfully
                  </p>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={validateBackupFile}
                    disabled={!selectedFile || isValidating}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 text-xs sm:text-sm rounded-lg hover:bg-blue-700 active:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 active:scale-95"
                  >
                    {isValidating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                        <span className="whitespace-nowrap">Validating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                        <span className="whitespace-nowrap">Validate Backup</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={previewRestore}
                    disabled={!selectedFile}
                    className="flex-1 bg-green-600 text-white py-2 px-4 text-xs sm:text-sm rounded-lg hover:bg-green-700 active:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    <span className="whitespace-nowrap">Preview Restore</span>
                  </button>
                </div>
                <button
                  onClick={executeRestore}
                  disabled={!restorePreview || isRestoring}
                  className="w-full bg-red-600 text-white py-2 px-4 text-xs sm:text-sm rounded-lg hover:bg-red-700 active:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 active:scale-95"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      <span className="whitespace-nowrap">Restoring...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                      <span className="whitespace-nowrap">Execute Restore</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Restore Preview */}
        {restorePreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 sm:mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-yellow-800">Restore Preview</h3>
            </div>
            <p className="text-xs sm:text-sm text-yellow-700 mb-3 sm:mb-4">
              The following changes will be made to your database:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Object.entries(restorePreview).map(([collection, data]) => {
                const displayName = collection
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
                
                return (
                  <div key={collection} className="bg-white rounded-lg p-3 sm:p-4 border">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{displayName}</h4>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current:</span>
                        <span className="font-medium">{data.current}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Backup:</span>
                        <span className="font-medium">{data.backup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Change:</span>
                        <span className={`font-medium ${data.difference > 0 ? 'text-green-600' : data.difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {data.difference > 0 ? '+' : ''}{data.difference}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Validation Results */}
        {validationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-blue-800">Backup Validation Results</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-3">Validation Checks</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${validationResult.validation.metadataValid ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="text-xs sm:text-sm">Metadata Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${validationResult.validation.dataStructureValid ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="text-xs sm:text-sm">Data Structure Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${validationResult.validation.recordCountsMatch ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="text-xs sm:text-sm">Record Counts Match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${validationResult.validation.collectionsComplete ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="text-xs sm:text-sm">Collections Complete</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-3">Backup Summary</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-blue-700">Total Records:</span>
                    <span className="font-medium">{validationResult.summary.totalRecords.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-blue-700">Collections:</span>
                    <span className="font-medium break-words">{validationResult.summary.collections.join(', ')}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-blue-700">Version:</span>
                    <span className="font-medium">{validationResult.summary.version}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-blue-700">Created:</span>
                    <span className="font-medium break-words">{formatDate(validationResult.summary.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Backup List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 sm:mt-8 bg-white rounded-lg shadow-md"
        >
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 flex-shrink-0" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Available Backups</h2>
              </div>
              <button
                onClick={fetchBackups}
                disabled={isLoading}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400 mr-2 sm:mr-3" />
                <span className="text-sm sm:text-base text-gray-600">Loading backups...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600">No backups available</p>
                <p className="text-xs sm:text-sm text-gray-500">Generate your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {backups.map((backup, index) => (
                  <motion.div
                    key={backup.filename}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                      <div className="flex-shrink-0">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 break-all">{backup.filename}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="break-all">{formatDate(backup.createdAt)}</span>
                          </span>
                          <span className="whitespace-nowrap">{formatFileSize(backup.size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => downloadBackup(backup.filename)}
                        className="p-2 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors duration-200 active:scale-95"
                        title="Download backup"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => deleteBackup(backup.filename)}
                        className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors duration-200 active:scale-95"
                        title="Delete backup"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BackupRestorePage;
