import { Router } from 'express';
import { AuthController } from './controllers/AuthController';
import { container } from '../config/container';

const controller = new AuthController(container);

export const authRouter = Router();

authRouter.post('/signup', (req, res, next) => controller.signUp(req, res, next));
authRouter.post('/login', (req, res, next) => controller.login(req, res, next));
authRouter.post('/driver/create', (req, res, next) => controller.createDriver(req, res, next));
authRouter.post('/logout', (req, res, next) => controller.logout(req, res, next));
authRouter.post('/reset-password', (req, res, next) => controller.resetPassword(req, res, next));
authRouter.post('/refresh', (req, res, next) => controller.refresh(req, res, next));
