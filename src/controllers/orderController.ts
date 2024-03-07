import { NextFunction, Request, Response } from 'express'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

import * as orderService from './../services'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

function dollarsToCents(amountInDollars: number): number {
  return Math.round(amountInDollars * 100)
}

import { stripe } from '../lib/stripe'

export const valorantEloCheckout = async (req: Request, res: Response, next: NextFunction) => {
  const authorizationHeader = req.headers.authorization

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authorizationHeader || '' },
    },
  })
  try {
    const token = req.token
    const {
      noStack,
      totalPrice,
      currentRank,
      currentDivision,
      targetRank,
      targetDivision,
      currentRR,
      typeService,
      winMatch,
      agentRequest = ['Jett', 'Brimstone'],
      priority,
      stream,
      offlineChat,
      type_order,
    } = req.body

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    console.log(user)

    if (user) {
      const priceAmount = dollarsToCents(totalPrice)

      //
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .insert({
          status: 'Unpaid',
          customer: user?.id,
          game_id: '2',
          price: totalPrice,
          type_order: type_order,
        })
        .select()

      console.log(ordersData)
      console.log(ordersError)

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Boostingelo ${
                  currentRank +
                  ' ' +
                  currentDivision +
                  ' ' +
                  currentRR +
                  ' - ' +
                  targetRank +
                  ' ' +
                  targetDivision
                }`,
              },
              unit_amount: priceAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:3000/dashboard',
        cancel_url: 'http://localhost:3000/dashboard',
      })

      if (ordersData && ordersData.length > 0) {
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert([
            {
              order_id: ordersData[0]?.order_id,
              stripe_payment_id: session.id,
              currency: session.currency,
              status: session.payment_status,
            },
          ])
          .select()

        console.log(paymentData, paymentError)

        const { data: orderDetails, error: orderDetailsError } = await supabase
          .from('orders_details')
          .insert([
            {
              start_rank: currentRank,
              start_division: currentDivision,
              end_rank: targetRank,
              end_division: targetDivision,
              current_rank: currentRank,
              rank_rating:
                currentRR === '0-25RR'
                  ? 0
                  : currentRR === '26-50RR'
                  ? 26
                  : currentRR === '51-75'
                  ? 51
                  : currentRR === '76-100RR'
                  ? 76
                  : 0,
              type_service: typeService,
              win_match: winMatch,
              agents_request: agentRequest,
              priority: priority,
              stream: stream,
              offline_chat: offlineChat,
              order_id: ordersData[0]?.order_id,
              no_stack: noStack,
            },
          ])
          .select()
        // console.log(orderDetails, orderDetailsError)
      }
      res.status(200).send({
        isError: false,
        data: session.url,
      })
    }
  } catch (error) {
    next(error)
  }
}
