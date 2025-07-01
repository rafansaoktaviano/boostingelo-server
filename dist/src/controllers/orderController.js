"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageSendAsSystem = exports.valorantEloCheckout = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const stripe_1 = require("../lib/stripe");
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE || '';
function dollarsToCents(amountInDollars) {
    return Math.round(amountInDollars * 100);
}
const valorantEloCheckout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const authorizationHeader = req.headers.authorization;
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: { Authorization: authorizationHeader || '' },
        },
    });
    try {
        const token = req.token;
        const { noStack, totalPrice, currentRank, currentDivision, targetRank, targetDivision, currentRR, typeService, winMatch, agentRequest, priority, stream, offlineChat, type_order, region, } = req.body;
        console.log(region);
        const { data: { user }, error, } = yield supabase.auth.getUser(token);
        if (user) {
            const priceAmount = dollarsToCents(totalPrice);
            const { data: ordersData, error: ordersError } = yield supabase
                .from('orders')
                .insert({
                status: 'Unpaid',
                customer: user === null || user === void 0 ? void 0 : user.id,
                game_id: '2',
                price: totalPrice,
                type_order: type_order,
                region: region,
            })
                .select();
            if (ordersError)
                throw { message: ordersError.message };
            const session = yield stripe_1.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                metadata: {
                    order_id: (_a = ordersData[0]) === null || _a === void 0 ? void 0 : _a.order_id,
                    user_id: user.id,
                },
                customer_email: user.email,
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Boostingelo ${currentRank +
                                    ' ' +
                                    currentDivision +
                                    ' ' +
                                    currentRR +
                                    ' - ' +
                                    targetRank +
                                    ' ' +
                                    targetDivision}`,
                            },
                            unit_amount: priceAmount,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
                cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
            });
            if (ordersData && ordersData.length > 0) {
                const { data: paymentData, error: paymentError } = yield supabase
                    .from('payments')
                    .insert([
                    {
                        order_id: (_b = ordersData[0]) === null || _b === void 0 ? void 0 : _b.order_id,
                        stripe_payment_id: session.id,
                        currency: session.currency,
                        status: session.payment_status,
                    },
                ])
                    .select();
                if (paymentError)
                    throw { message: paymentError.message };
                const { data: orderDetails, error: orderDetailsError } = yield supabase
                    .from('orders_details')
                    .insert([
                    {
                        start_rank: currentRank,
                        start_division: currentDivision,
                        end_rank: targetRank,
                        end_division: targetDivision,
                        rank_rating: currentRR === '0-25RR'
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
                        order_id: (_c = ordersData[0]) === null || _c === void 0 ? void 0 : _c.order_id,
                        no_stack: noStack,
                        current_rank: currentRank,
                        current_division: currentDivision,
                        current_rank_rating: currentRR,
                    },
                ])
                    .select();
                if (orderDetailsError)
                    throw { message: orderDetailsError.message };
                console.log(session.id);
            }
            res.status(200).send({
                isError: false,
                data: session.url,
            });
        }
    }
    catch (error) {
        next(error);
    }
});
exports.valorantEloCheckout = valorantEloCheckout;
const messageSendAsSystem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorizationHeader = req.headers.authorization;
        const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRole, {
            global: {
                headers: { Authorization: authorizationHeader || '' },
            },
        });
        const { room_id, user_id, RR, rank } = req.body;
        const splitRank = rank.split(' ');
        if (!room_id || !user_id || !RR || !rank) {
            throw { message: "Message, room, and user can't be empty!!." };
        }
        const { data, error } = yield supabase
            .from('chat_messages')
            .insert([
            {
                room_id: room_id,
                message: `🎉 You've reached ${rank} with ${RR} RR!!`,
                is_read: false,
                user_id: user_id,
            },
        ])
            .select();
        if (error)
            throw { message: error.message };
        const { data: orderDetails, error: errorOrderDetails } = yield supabase
            .from('orders_details')
            .update({
            current_rank: splitRank[0],
            current_division: splitRank[1],
            current_rank_rating: RR,
        })
            .eq('order_id', room_id)
            .select();
        console.log(orderDetails);
        res.status(200).send({
            isError: false,
            message: 'Submit Success',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.messageSendAsSystem = messageSendAsSystem;
