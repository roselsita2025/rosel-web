import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import { User } from '../models/user.model.js';
import Review from '../models/Review.js';
import Transaction from '../models/transaction.model.js';
import Coupon from '../models/coupon.model.js';
import Notification from '../models/notification.model.js';
import ActivityLog from '../models/activityLog.model.js';
import ReplacementRequest from '../models/replacementRequest.model.js';
import { Chat } from '../models/chat.model.js';
import { Message } from '../models/message.model.js';
import { FAQ } from '../models/faq.model.js';
import WriteOff from '../models/writeOff.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupsDir = path.join(__dirname, '../backups');
try {
  await fs.mkdir(backupsDir, { recursive: true });
} catch (error) {
  console.log('Backups directory already exists or could not be created');
}

export const generateBackup = async (req, res) => {
  try {
    console.log('🔄 Starting backup generation...');
    
    const [
      products,
      orders,
      users,
      reviews,
      transactions,
      coupons,
      notifications,
      activityLogs,
      replacementRequests,
      chats,
      messages,
      faqs,
      writeOffs
    ] = await Promise.all([
      Product.find({}),
      Order.find({}),
      User.find({}),
      Review.find({}),
      Transaction.find({}),
      Coupon.find({}),
      Notification.find({}),
      ActivityLog.find({}),
      ReplacementRequest.find({}),
      Chat.find({}),
      Message.find({}),
      FAQ.find({}),
      WriteOff.find({})
    ]);

    const backup = {
      metadata: {
        version: '2.1',
        timestamp: new Date().toISOString(),
        collections: [
          'products', 'orders', 'users', 'reviews', 'transactions', 
          'coupons', 'notifications', 'activityLogs', 'replacementRequests', 
          'chats', 'messages', 'faqs', 'writeOffs'
        ],
        totalRecords: products.length + orders.length + users.length + reviews.length + 
                     transactions.length + coupons.length + notifications.length + 
                     activityLogs.length + replacementRequests.length + chats.length + 
                     messages.length + faqs.length + writeOffs.length,
        generatedBy: req.user._id,
        generatedByEmail: req.user.email
      },
      data: {
        products,
        orders,
        users,
        reviews,
        transactions,
        coupons,
        notifications,
        activityLogs,
        replacementRequests,
        chats,
        messages,
        faqs,
        writeOffs
      }
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.json`;
    const filepath = path.join(backupsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
    const stats = await fs.stat(filepath);
    const fileSizeKB = Math.round(stats.size / 1024);

    console.log(`✅ Backup generated successfully: ${filename} (${fileSizeKB} KB)`);

    res.json({
      success: true,
      filename,
      fileSize: fileSizeKB,
      totalRecords: backup.metadata.totalRecords,
      collections: backup.metadata.collections,
      timestamp: backup.metadata.timestamp
    });

  } catch (error) {
    console.error('❌ Error generating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Backup generation failed',
      error: error.message
    });
  }
};

export const listBackups = async (req, res) => {
  try {
    console.log('📋 Fetching backup list...');
    
    const files = await fs.readdir(backupsDir);
    const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));
    
    const backups = await Promise.all(
      backupFiles.map(async (filename) => {
        const filepath = path.join(backupsDir, filename);
        const stats = await fs.stat(filepath);
        
        return {
          filename,
          size: Math.round(stats.size / 1024), // Size in KB
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
    );

    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`📋 Found ${backups.length} backup files`);

    res.json({
      success: true,
      backups,
      total: backups.length
    });

  } catch (error) {
    console.error('❌ Error listing backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};

export const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename.startsWith('backup_') || !filename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup filename'
      });
    }

    const filepath = path.join(backupsDir, filename);
    
    try {
      await fs.access(filepath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    console.log(`📥 Downloading backup: ${filename}`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = await fs.readFile(filepath);
    res.send(fileStream);

  } catch (error) {
    console.error('❌ Error downloading backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: error.message
    });
  }
};

export const deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename.startsWith('backup_') || !filename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup filename'
      });
    }

    const filepath = path.join(backupsDir, filename);
    
    try {
      await fs.access(filepath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    await fs.unlink(filepath);
    
    console.log(`🗑️ Deleted backup: ${filename}`);

    res.json({
      success: true,
      message: 'Backup deleted successfully',
      filename
    });

  } catch (error) {
    console.error('❌ Error deleting backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
};

export const previewRestore = async (req, res) => {
  try {
    const { backupData } = req.body;
    
    if (!backupData || !backupData.data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup data format'
      });
    }

    console.log('🔍 Generating restore preview...');

    const currentCounts = {
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      users: await User.countDocuments(),
      reviews: await Review.countDocuments()
    };

    const backupCounts = {
      products: backupData.data.products?.length || 0,
      orders: backupData.data.orders?.length || 0,
      users: backupData.data.users?.length || 0,
      reviews: backupData.data.reviews?.length || 0
    };

    const preview = {
      products: {
        current: currentCounts.products,
        backup: backupCounts.products,
        difference: backupCounts.products - currentCounts.products,
        willReplace: backupCounts.products > 0
      },
      orders: {
        current: currentCounts.orders,
        backup: backupCounts.orders,
        difference: backupCounts.orders - currentCounts.orders,
        willReplace: backupCounts.orders > 0
      },
      users: {
        current: currentCounts.users,
        backup: backupCounts.users,
        difference: backupCounts.users - currentCounts.users,
        willReplace: backupCounts.users > 0
      },
      reviews: {
        current: currentCounts.reviews,
        backup: backupCounts.reviews,
        difference: backupCounts.reviews - currentCounts.reviews,
        willReplace: backupCounts.reviews > 0
      }
    };

    console.log('✅ Restore preview generated');

    res.json({
      success: true,
      preview,
      backupMetadata: backupData.metadata || null
    });

  } catch (error) {
    console.error('❌ Error generating restore preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate restore preview',
      error: error.message
    });
  }
};

export const executeRestore = async (req, res) => {
  try {
    const { backupData, confirmReplace } = req.body;
    
    if (!backupData || !backupData.data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup data format'
      });
    }

    if (!confirmReplace) {
      return res.status(400).json({
        success: false,
        message: 'Restore confirmation required'
      });
    }

    console.log('🔄 Starting restore process...');

    const restoreResults = {};

    if (backupData.data.products && backupData.data.products.length > 0) {
      console.log(`📦 Restoring ${backupData.data.products.length} products...`);
      await Product.deleteMany({});
      await Product.insertMany(backupData.data.products);
      restoreResults.products = backupData.data.products.length;
    }

    // Restore Orders
    if (backupData.data.orders && backupData.data.orders.length > 0) {
      console.log(`📋 Restoring ${backupData.data.orders.length} orders...`);
      await Order.deleteMany({});
      await Order.insertMany(backupData.data.orders);
      restoreResults.orders = backupData.data.orders.length;
    }

    // Restore Users
    if (backupData.data.users && backupData.data.users.length > 0) {
      console.log(`👥 Restoring ${backupData.data.users.length} users...`);
      await User.deleteMany({});
      await User.insertMany(backupData.data.users);
      restoreResults.users = backupData.data.users.length;
    }

    // Restore Reviews
    if (backupData.data.reviews && backupData.data.reviews.length > 0) {
      console.log(`⭐ Restoring ${backupData.data.reviews.length} reviews...`);
      await Review.deleteMany({});
      await Review.insertMany(backupData.data.reviews);
      restoreResults.reviews = backupData.data.reviews.length;
    }

    // Restore Transactions
    if (backupData.data.transactions && backupData.data.transactions.length > 0) {
      console.log(`💳 Restoring ${backupData.data.transactions.length} transactions...`);
      await Transaction.deleteMany({});
      await Transaction.insertMany(backupData.data.transactions);
      restoreResults.transactions = backupData.data.transactions.length;
    }

    // Restore Coupons
    if (backupData.data.coupons && backupData.data.coupons.length > 0) {
      console.log(`🎫 Restoring ${backupData.data.coupons.length} coupons...`);
      await Coupon.deleteMany({});
      await Coupon.insertMany(backupData.data.coupons);
      restoreResults.coupons = backupData.data.coupons.length;
    }

    // Restore Notifications
    if (backupData.data.notifications && backupData.data.notifications.length > 0) {
      console.log(`🔔 Restoring ${backupData.data.notifications.length} notifications...`);
      await Notification.deleteMany({});
      await Notification.insertMany(backupData.data.notifications);
      restoreResults.notifications = backupData.data.notifications.length;
    }

    // Restore Activity Logs
    if (backupData.data.activityLogs && backupData.data.activityLogs.length > 0) {
      console.log(`📊 Restoring ${backupData.data.activityLogs.length} activity logs...`);
      await ActivityLog.deleteMany({});
      await ActivityLog.insertMany(backupData.data.activityLogs);
      restoreResults.activityLogs = backupData.data.activityLogs.length;
    }

    // Restore Replacement Requests
    if (backupData.data.replacementRequests && backupData.data.replacementRequests.length > 0) {
      console.log(`🔄 Restoring ${backupData.data.replacementRequests.length} replacement requests...`);
      await ReplacementRequest.deleteMany({});
      await ReplacementRequest.insertMany(backupData.data.replacementRequests);
      restoreResults.replacementRequests = backupData.data.replacementRequests.length;
    }

    // Restore Chats
    if (backupData.data.chats && backupData.data.chats.length > 0) {
      console.log(`💬 Restoring ${backupData.data.chats.length} chats...`);
      await Chat.deleteMany({});
      await Chat.insertMany(backupData.data.chats);
      restoreResults.chats = backupData.data.chats.length;
    }

    // Restore Messages
    if (backupData.data.messages && backupData.data.messages.length > 0) {
      console.log(`📨 Restoring ${backupData.data.messages.length} messages...`);
      await Message.deleteMany({});
      await Message.insertMany(backupData.data.messages);
      restoreResults.messages = backupData.data.messages.length;
    }

    // Restore FAQs
    if (backupData.data.faqs && backupData.data.faqs.length > 0) {
      console.log(`❓ Restoring ${backupData.data.faqs.length} FAQs...`);
      await FAQ.deleteMany({});
      await FAQ.insertMany(backupData.data.faqs);
      restoreResults.faqs = backupData.data.faqs.length;
    }

    // Restore Write-offs
    if (backupData.data.writeOffs && backupData.data.writeOffs.length > 0) {
      console.log(`📝 Restoring ${backupData.data.writeOffs.length} write-offs...`);
      await WriteOff.deleteMany({});
      await WriteOff.insertMany(backupData.data.writeOffs);
      restoreResults.writeOffs = backupData.data.writeOffs.length;
    }

    console.log('✅ Restore completed successfully');

    res.json({
      success: true,
      message: 'Restore completed successfully',
      results: restoreResults,
      restoredAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error executing restore:', error);
    res.status(500).json({
      success: false,
      message: 'Restore failed',
      error: error.message
    });
  }
};

// Upload and validate backup file
export const uploadRestore = async (req, res) => {
  try {
    // This would typically handle file upload via multer
    // For now, we'll expect the backup data in the request body
    const { backupData } = req.body;
    
    if (!backupData) {
      return res.status(400).json({
        success: false,
        message: 'No backup data provided'
      });
    }

    // Validate backup structure
    if (!backupData.metadata || !backupData.data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup format'
      });
    }

    // Validate required collections
    const requiredCollections = [
      'products', 'orders', 'users', 'reviews', 'transactions', 
      'coupons', 'notifications', 'activityLogs', 'replacementRequests', 
      'chats', 'messages', 'faqs', 'writeOffs'
    ];
    const missingCollections = requiredCollections.filter(
      collection => !backupData.data[collection]
    );

    if (missingCollections.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required collections: ${missingCollections.join(', ')}`
      });
    }

    console.log('✅ Backup file validated successfully');

    res.json({
      success: true,
      message: 'Backup file uploaded and validated',
      metadata: backupData.metadata,
      collections: Object.keys(backupData.data),
      totalRecords: Object.values(backupData.data).reduce((sum, arr) => sum + arr.length, 0)
    });

  } catch (error) {
    console.error('❌ Error uploading backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload backup',
      error: error.message
    });
  }
};

// Enhanced backup validation
export const validateBackup = async (req, res) => {
  try {
    const { backupData } = req.body;
    
    if (!backupData) {
      return res.status(400).json({
        success: false,
        message: 'No backup data provided'
      });
    }

    // Comprehensive validation
    const validationResult = validateBackupIntegrity(backupData);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Backup validation failed',
        error: validationResult.error
      });
    }

    // Additional checks
    const checks = {
      metadataValid: true,
      dataStructureValid: true,
      recordCountsMatch: true,
      collectionsComplete: true
    };

    // Check metadata completeness
    const requiredMetadataFields = ['version', 'timestamp', 'collections', 'totalRecords'];
    checks.metadataValid = requiredMetadataFields.every(field => 
      backupData.metadata[field] !== undefined
    );

    // Check data structure
    const requiredCollections = [
      'products', 'orders', 'users', 'reviews', 'transactions', 
      'coupons', 'notifications', 'activityLogs', 'replacementRequests', 
      'chats', 'messages', 'faqs'
    ];
    checks.dataStructureValid = requiredCollections.every(collection => 
      Array.isArray(backupData.data[collection])
    );

    // Check record counts
    const actualTotalRecords = Object.values(backupData.data).reduce((sum, arr) => sum + arr.length, 0);
    checks.recordCountsMatch = backupData.metadata.totalRecords === actualTotalRecords;

    // Check if all required collections are present
    checks.collectionsComplete = requiredCollections.every(collection => 
      backupData.data[collection] !== undefined
    );

    res.json({
      success: true,
      message: 'Backup validation completed',
      validation: checks,
      metadata: backupData.metadata,
      summary: {
        totalRecords: actualTotalRecords,
        collections: Object.keys(backupData.data),
        version: backupData.metadata.version,
        timestamp: backupData.metadata.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error validating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate backup',
      error: error.message
    });
  }
};

// Helper function for backup integrity validation
const validateBackupIntegrity = (backupData) => {
  try {
    // Check if metadata has required fields
    const requiredMetadataFields = ['version', 'timestamp', 'collections', 'totalRecords'];
    if (!requiredMetadataFields.every(field => backupData.metadata[field] !== undefined)) {
      return { valid: false, error: 'Missing required metadata fields' };
    }

    // Check if data collections exist and are arrays
    const requiredCollections = [
      'products', 'orders', 'users', 'reviews', 'transactions', 
      'coupons', 'notifications', 'activityLogs', 'replacementRequests', 
      'chats', 'messages', 'faqs'
    ];
    for (const collection of requiredCollections) {
      if (!Array.isArray(backupData.data[collection])) {
        return { valid: false, error: `Invalid data structure for ${collection}` };
      }
    }

    // Check if totalRecords matches actual data
    const actualTotalRecords = Object.values(backupData.data).reduce((sum, arr) => sum + arr.length, 0);
    if (backupData.metadata.totalRecords !== actualTotalRecords) {
      return { valid: false, error: 'Total records count mismatch' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid backup file format' };
  }
};

// Get backup statistics
export const getBackupStats = async (req, res) => {
  try {
    const files = await fs.readdir(backupsDir);
    const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));

    let totalSize = 0;
    let totalRecords = 0;
    const stats = {
      totalBackups: backupFiles.length,
      totalSize: 0,
      totalRecords: 0,
      averageSize: 0,
      oldestBackup: null,
      newestBackup: null,
      collections: {
        products: 0,
        orders: 0,
        users: 0,
        reviews: 0
      }
    };

    if (backupFiles.length > 0) {
      const backupDetails = await Promise.all(
        backupFiles.map(async (file) => {
          const filepath = path.join(backupsDir, file);
          const stats = await fs.stat(filepath);
          let metadata = {};
          
          try {
            const content = await fs.readFile(filepath, 'utf-8');
            const backupData = JSON.parse(content);
            metadata = backupData.metadata || {};
          } catch (parseError) {
            console.warn(`⚠️ Could not parse metadata for ${file}:`, parseError.message);
          }

          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime,
            metadata
          };
        })
      );

      // Calculate statistics
      totalSize = backupDetails.reduce((sum, backup) => sum + backup.size, 0);
      totalRecords = backupDetails.reduce((sum, backup) => sum + (backup.metadata.totalRecords || 0), 0);
      
      stats.totalSize = totalSize;
      stats.totalRecords = totalRecords;
      stats.averageSize = Math.round(totalSize / backupFiles.length);
      
      // Find oldest and newest
      const sortedByDate = backupDetails.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      stats.oldestBackup = sortedByDate[0].createdAt;
      stats.newestBackup = sortedByDate[sortedByDate.length - 1].createdAt;

      // Calculate collection totals from the most recent backup
      if (backupDetails.length > 0) {
        const mostRecent = backupDetails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        try {
          const content = await fs.readFile(path.join(backupsDir, mostRecent.filename), 'utf-8');
          const backupData = JSON.parse(content);
          if (backupData.data) {
            stats.collections.products = backupData.data.products?.length || 0;
            stats.collections.orders = backupData.data.orders?.length || 0;
            stats.collections.users = backupData.data.users?.length || 0;
            stats.collections.reviews = backupData.data.reviews?.length || 0;
          }
        } catch (error) {
          console.warn('Could not read most recent backup for collection stats');
        }
      }
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error getting backup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup statistics',
      error: error.message
    });
  }
};

// Cleanup old backups (keep only the most recent N backups)
export const cleanupOldBackups = async (req, res) => {
  try {
    const { keepCount = 10 } = req.body;
    
    const files = await fs.readdir(backupsDir);
    const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));

    if (backupFiles.length <= keepCount) {
      return res.json({
        success: true,
        message: `No cleanup needed. Current backup count: ${backupFiles.length}`,
        deletedCount: 0
      });
    }

    // Get file stats and sort by creation date
    const backupDetails = await Promise.all(
      backupFiles.map(async (file) => {
        const filepath = path.join(backupsDir, file);
        const stats = await fs.stat(filepath);
        return {
          filename: file,
          filepath,
          createdAt: stats.birthtime
        };
      })
    );

    // Sort by creation date (oldest first)
    backupDetails.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Delete oldest backups
    const toDelete = backupDetails.slice(0, backupFiles.length - keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        await fs.unlink(backup.filepath);
        deletedCount++;
        console.log(`🗑️ Deleted old backup: ${backup.filename}`);
      } catch (deleteError) {
        console.error(`❌ Failed to delete ${backup.filename}:`, deleteError.message);
      }
    }

    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} old backups.`,
      deletedCount,
      remainingCount: backupFiles.length - deletedCount
    });

  } catch (error) {
    console.error('❌ Error cleaning up old backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old backups',
      error: error.message
    });
  }
};
