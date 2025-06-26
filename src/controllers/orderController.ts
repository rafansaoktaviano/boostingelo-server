import { NextFunction, Request, Response } from 'express'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

import { stripe } from '../lib/stripe'
import supabase from '../config/supabase'
import * as orderService from './../services'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE || ''

function dollarsToCents(amountInDollars: number): number {
  return Math.round(amountInDollars * 100)
}

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
      agentRequest,
      priority,
      stream,
      offlineChat,
      type_order,
      region,
    } = req.body

    console.log(region)

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (user) {
      const priceAmount = dollarsToCents(totalPrice)

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .insert({
          status: 'Unpaid',
          customer: user?.id,
          game_id: '2',
          price: totalPrice,
          type_order: type_order,
          region: region,
        })
        .select()

      if (ordersError) throw { message: ordersError.message }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        metadata: {
          order_id: ordersData[0]?.order_id,
          user_id: user.id,
        },
        customer_email: user.email,
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
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
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

        if (paymentError) throw { message: paymentError.message }

        const { data: orderDetails, error: orderDetailsError } = await supabase
          .from('orders_details')
          .insert([
            {
              start_rank: currentRank,
              start_division: currentDivision,
              end_rank: targetRank,
              end_division: targetDivision,
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
              current_rank: currentRank,
              current_division: currentDivision,
              current_rank_rating: currentRR,
            },
          ])
          .select()
        if (orderDetailsError) throw { message: orderDetailsError.message }
        console.log(session.id)
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

export const messageSendAsSystem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorizationHeader = req.headers.authorization

    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      global: {
        headers: { Authorization: authorizationHeader || '' },
      },
    })

    const { room_id, user_id, RR, rank } = req.body

    const splitRank = rank.split(' ')

    if (!room_id || !user_id || !RR || !rank) {
      throw { message: "Message, room, and user can't be empty!!." }
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          room_id: room_id,
          message: `🎉 You've reached ${rank} with ${RR} RR!!`,
          is_read: false,
          user_id: user_id,
        },
      ])
      .select()

    if (error) throw { message: error.message }

    const { data: orderDetails, error: errorOrderDetails } = await supabase
      .from('orders_details')
      .update({
        current_rank: splitRank[0],
        current_division: splitRank[1],
        current_rank_rating: RR,
      })
      .eq('order_id', room_id)
      .select()

    console.log(orderDetails)

    res.status(200).send({
      isError: false,
      message: 'Submit Success',
    })
  } catch (error) {
    next(error)
  }
}
