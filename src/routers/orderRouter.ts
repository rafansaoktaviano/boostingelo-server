import express from 'express'

const router = express.Router()

import * as orderController from './../controllers'

router.get('/order', orderController.valorantEloCheckout)

export default router
