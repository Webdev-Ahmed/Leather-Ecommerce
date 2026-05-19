import { model } from "mongoose";
import { OrderSchema, type IOrder } from "../schemas/order.schema";

const Order = model<IOrder>("Order", OrderSchema);

export default Order;
