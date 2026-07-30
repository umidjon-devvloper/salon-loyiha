import { Router } from 'express';
import {
  salonCreateSchema,
  salonUpdateSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  masterCreateSchema,
  masterUpdateSchema,
  reorderSchema,
  idParamSchema,
  filenameParamSchema,
} from '@gozal/shared/schemas/owner.schema';

import * as ctrl from '../controllers/owner.controller.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { ownerOfSalon } from '../middleware/ownerOfSalon.js';
import { validate } from '../middleware/validate.js';
import { uploadSingle, uploadMany } from '../middleware/upload.js';
import { ROLES } from '../config/constants.js';

/**
 * Salon egasi kabineti.
 *
 * Barcha yo'llar: auth → requireRole('owner','admin') → ownerOfSalon.
 * Yagona istisno — salon yaratish: o'sha paytda hali salon yo'q,
 * shuning uchun `ownerOfSalon` ishlay olmaydi.
 */
const router = Router();

router.use(auth, requireRole(ROLES.OWNER, ROLES.ADMIN));

// ── Salon ───────────────────────────────────────────────────────

router.post('/salon', validate({ body: salonCreateSchema }), ctrl.createSalon);

router.get('/salon', ownerOfSalon, ctrl.getSalon);
router.put('/salon', ownerOfSalon, validate({ body: salonUpdateSchema }), ctrl.updateSalon);
router.post('/salon/submit', ownerOfSalon, ctrl.submitSalon);

router.post('/salon/images', ownerOfSalon, uploadMany('images'), ctrl.uploadImages);
router.delete(
  '/salon/images/:filename',
  ownerOfSalon,
  validate({ params: filenameParamSchema }),
  ctrl.deleteImage,
);
router.patch(
  '/salon/cover/:filename',
  ownerOfSalon,
  validate({ params: filenameParamSchema }),
  ctrl.setCover,
);

// ── Xizmatlar ───────────────────────────────────────────────────

router.get('/services', ownerOfSalon, ctrl.listServices);
router.post('/services', ownerOfSalon, validate({ body: serviceCreateSchema }), ctrl.createService);
router.patch(
  '/services/reorder',
  ownerOfSalon,
  validate({ body: reorderSchema }),
  ctrl.reorderServices,
);
router.put(
  '/services/:id',
  ownerOfSalon,
  validate({ params: idParamSchema, body: serviceUpdateSchema }),
  ctrl.updateService,
);
router.delete(
  '/services/:id',
  ownerOfSalon,
  validate({ params: idParamSchema }),
  ctrl.deleteService,
);

// ── Mutaxassislar ───────────────────────────────────────────────

router.get('/masters', ownerOfSalon, ctrl.listMasters);
router.post('/masters', ownerOfSalon, validate({ body: masterCreateSchema }), ctrl.createMaster);
router.put(
  '/masters/:id',
  ownerOfSalon,
  validate({ params: idParamSchema, body: masterUpdateSchema }),
  ctrl.updateMaster,
);
router.delete('/masters/:id', ownerOfSalon, validate({ params: idParamSchema }), ctrl.deleteMaster);
router.post(
  '/masters/:id/photo',
  ownerOfSalon,
  validate({ params: idParamSchema }),
  uploadSingle('photo'),
  ctrl.uploadMasterPhoto,
);

export default router;
