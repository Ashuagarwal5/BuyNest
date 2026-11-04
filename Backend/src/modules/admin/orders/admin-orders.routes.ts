import { Router } from 'express';

import { sendSuccess } from '../../../lib/http.js';
import { idParamsSchema } from '../../../lib/params.js';
import { getAdmin, requireRole } from '../../../middleware/admin-auth.js';
import {
  changeOrderStatusBodySchema,
  listOrdersQuerySchema,
  recordPaymentBodySchema,
  reopenDeliveryBodySchema,
} from './admin-orders.schemas.js';
import {
  changeOrderStatus,
  getOrderDetail,
  listOrders,
  recordPayment,
  reopenDeliveredOrder,
} from './admin-orders.service.js';

export const adminOrdersRouter = Router();

adminOrdersRouter.get('/', async (req, res) => {
  sendSuccess(res, await listOrders(listOrdersQuerySchema.parse(req.query)));
});

adminOrdersRouter.get('/:id', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await getOrderDetail(id));
});

adminOrdersRouter.patch('/:id/status', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const body = changeOrderStatusBodySchema.parse(req.body);
  sendSuccess(res, await changeOrderStatus(id, body.status, body.note, getAdmin(res)));
});

adminOrdersRouter.patch('/:id/payment', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const body = recordPaymentBodySchema.parse(req.body);
  sendSuccess(res, await recordPayment(id, body.paymentStatus, body.note, getAdmin(res)));
});

/** Fixes an order marked delivered by mistake. Super admin only; a reason is required. */
adminOrdersRouter.post('/:id/reopen-delivery', requireRole('SUPER_ADMIN'), async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const body = reopenDeliveryBodySchema.parse(req.body);
  sendSuccess(res, await reopenDeliveredOrder(id, body.reason, getAdmin(res)));
});
