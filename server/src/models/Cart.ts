import { model } from "mongoose";
import { CartSchema, type ICart } from "../schemas/cart.schema";

const Cart = model<ICart>("Cart", CartSchema);

export default Cart;
