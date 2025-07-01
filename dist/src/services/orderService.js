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
exports.createOrder = void 0;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const createOrder = (data) => __awaiter(void 0, void 0, void 0, function* () {
    //   try {
    //     const { data: ordersData, error: ordersError } = await supabase
    //       .from('orders')
    //       .insert({
    //         status: 'Unpaid',
    //         customer: data.customer,
    //         game_id: '2',
    //         price: data.price,
    //         type_order: data.type_order,
    //         region: data.region,
    //       })
    //       .select()
    //     if (ordersError) {
    //       throw ordersError
    //     }
    //     return ordersData
    //   } catch (error) {
    //     return error
    //   }
});
exports.createOrder = createOrder;
