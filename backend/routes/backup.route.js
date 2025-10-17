import express from 'express';
import {
  generateBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  previewRestore,
  executeRestore,
  uploadRestore,
  validateBackup,
  getBackupStats,
  cleanupOldBackups
} from '../controllers/backup.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyAdmin);

router.get('/generate', generateBackup);
router.get('/list', listBackups);
router.get('/download/:filename', downloadBackup);
router.delete('/delete/:filename', deleteBackup);

router.post('/restore/upload', uploadRestore);
router.post('/restore/preview', previewRestore);
router.post('/restore/execute', executeRestore);

router.post('/validate', validateBackup);
router.get('/stats', getBackupStats);
router.post('/cleanup', cleanupOldBackups);

export default router;
