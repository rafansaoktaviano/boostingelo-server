interface Data {
  customer: string
  price: number
  type_order: string
  region: string
}
interface User {
  id: string
}

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

export const createOrder = async (data: Data) => {
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
}
