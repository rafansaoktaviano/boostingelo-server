import { NextFunction, Request, Response } from 'express'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '../lib/stripe'
import supabase from '../config/supabase'
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

interface CustomRequest extends Request {
  rawBody?: string
}

export const stripeWebhook = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature']
    const body = req.body

    console.log('sig', sig)
    let event
    event = stripe.webhooks.constructEvent(body, sig || '', endpointSecret)

    switch (event.type) {
      case 'checkout.session.completed':
        const checkout = event.data.object

        console.log(checkout.payment_status)

        if (checkout.payment_status === 'paid') {
          const { data: updatePayments, error: updatePaymentsError } = await supabase
            .from('payments')
            .update({ status: 'paid' })
            .eq('order_id', checkout.metadata?.order_id)
            .select()

          console.log('updatePaymentsError', updatePaymentsError)
          if (updatePaymentsError) throw updatePaymentsError

          const { data: updateOrder, error: updateOrderError } = await supabase
            .from('orders')
            .update({ status: 'Waiting For Booster' })
            .eq('order_id', checkout.metadata?.order_id)
            .select()
          console.log('updateOrderError', updateOrderError)

          if (updateOrderError) throw updateOrderError

          console.log('update successfully')
        }
        break
      default:
        console.log(`Unhandled2 event type ${event.type}.`)
    }
  } catch (error) {
    console.log(error)

    next(error)
  }
}
