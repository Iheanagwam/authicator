import { Router } from 'express';
import * as landingController from '../controllers/landing.controller.js';

const router = Router();

router.get('/',        landingController.showLanding);
router.get('/pricing', landingController.showPricing);
router.get('/docs',    landingController.showDocs);
router.get('/404',     landingController.show404);
router.get('/500',     landingController.show500);

export default router;