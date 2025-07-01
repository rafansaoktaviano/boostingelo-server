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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const stripe_1 = require("../lib/stripe");
const supabase_1 = __importDefault(require("../config/supabase"));
const endpointSecret = 'whsec_dbce4c85a7ac7bbb075446a17ed7937fef51386e049324ecb81832ddc5777493';
const stripeWebhook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const sig = req.headers['stripe-signature'];
        const body = req.body;
        console.log('sig', sig);
        let event;
        event = stripe_1.stripe.webhooks.constructEvent(body, sig || '', endpointSecret);
        switch (event.type) {
            case 'checkout.session.completed':
                const checkout = event.data.object;
                console.log(checkout.payment_status);
                if (checkout.payment_status === 'paid') {
                    const { data: updatePayments, error: updatePaymentsError } = yield supabase_1.default
                        .from('payments')
                        .update({ status: 'paid' })
                        .eq('order_id', (_a = checkout.metadata) === null || _a === void 0 ? void 0 : _a.order_id)
                        .select();
                    console.log('updatePaymentsError', updatePaymentsError);
                    if (updatePaymentsError)
                        throw updatePaymentsError;
                    const { data: updateOrder, error: updateOrderError } = yield supabase_1.default
                        .from('orders')
                        .update({ status: 'Waiting For Booster' })
                        .eq('order_id', (_b = checkout.metadata) === null || _b === void 0 ? void 0 : _b.order_id)
                        .select();
                    console.log('updateOrderError', updateOrderError);
                    if (updateOrderError)
                        throw updateOrderError;
                    console.log('update successfully');
                }
                break;
            default:
                console.log(`Unhandled2 event type ${event.type}.`);
        }
    }
    catch (error) {
        console.log(error);
        next(error);
    }
});
exports.stripeWebhook = stripeWebhook;
