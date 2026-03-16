import { Router } from 'express';
import { AuthController } from './controllers/AuthController';
import { container } from '../config/container';
import { validateBody } from '../../utils/validate';
import { SignUpSchema, LoginSchema, CreateDriverSchema } from './schemas';
import { jwtMiddleware } from './middleware/jwtMiddleware';
import { z } from 'zod';
const ConfirmResetSchema = z.object({ token: z.string().min(1), newPassword: z.string().min(8, 'Mot de passe : 8 caractères minimum') });

const controller = new AuthController(container);

export const authRouter = Router();

authRouter.post('/signup',        validateBody(SignUpSchema),       (req, res, next) => controller.signUp(req, res, next));
authRouter.post('/login',         validateBody(LoginSchema),        (req, res, next) => controller.login(req, res, next));
authRouter.post('/drivers',       jwtMiddleware, validateBody(CreateDriverSchema), (req, res, next) => controller.createDriver(req, res, next));
authRouter.post('/driver/create', jwtMiddleware, validateBody(CreateDriverSchema), (req, res, next) => controller.createDriver(req, res, next));
authRouter.post('/logout',               (req, res, next) => controller.logout(req, res, next));
authRouter.post('/confirm-reset-password', validateBody(ConfirmResetSchema), (req, res, next) => controller.confirmResetPassword(req, res, next));
authRouter.post('/reset-password',(req, res, next) => controller.resetPassword(req, res, next));
authRouter.post('/refresh',       (req, res, next) => controller.refresh(req, res, next));
