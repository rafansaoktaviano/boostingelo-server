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
exports.valorantEloCheckout = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
function dollarsToCents(amountInDollars) {
    return Math.round(amountInDollars * 100);
}
const stripe_1 = require("../lib/stripe");
const valorantEloCheckout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authorizationHeader = req.headers.authorization;
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: { Authorization: authorizationHeader || '' },
        },
    });
    try {
        const token = req.token;
        const { noStack, totalPrice, currentRank, currentDivision, targetRank, targetDivision, currentRR, typeService, winMatch, agentRequest = ['Jett', 'Brimstone'], priority, stream, offlineChat, type_order, } = req.body;
        const { data: { user }, error, } = yield supabase.auth.getUser(token);
        console.log(user);
        if (user) {
            const priceAmount = dollarsToCents(totalPrice);
            //
            const { data: ordersData, error: ordersError } = yield supabase
                .from('orders')
                .insert({
                status: 'Unpaid',
                customer: user === null || user === void 0 ? void 0 : user.id,
                game_id: '2',
                price: totalPrice,
                type_order: type_order,
            })
                .select();
            console.log(ordersData);
            console.log(ordersError);
            const session = yield stripe_1.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
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
                success_url: 'http://localhost:3000/dashboard',
                cancel_url: 'http://localhost:3000/dashboard',
            });
            if (ordersData && ordersData.length > 0) {
                const { data: paymentData, error: paymentError } = yield supabase
                    .from('payments')
                    .insert([
                    {
                        order_id: (_a = ordersData[0]) === null || _a === void 0 ? void 0 : _a.order_id,
                        stripe_payment_id: session.id,
                        currency: session.currency,
                        status: session.payment_status,
                    },
                ])
                    .select();
                console.log(paymentData, paymentError);
                const { data: orderDetails, error: orderDetailsError } = yield supabase
                    .from('orders_details')
                    .insert([
                    {
                        start_rank: currentRank,
                        start_division: currentDivision,
                        end_rank: targetRank,
                        end_division: targetDivision,
                        current_rank: currentRank,
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
                        order_id: (_b = ordersData[0]) === null || _b === void 0 ? void 0 : _b.order_id,
                        no_stack: noStack,
                    },
                ])
                    .select();
                // console.log(orderDetails, orderDetailsError)
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
