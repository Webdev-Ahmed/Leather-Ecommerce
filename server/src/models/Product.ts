import { model } from "mongoose";
import { ProductSchema, type IProduct } from "../schemas/product.schema";

const Product = model<IProduct>("Product", ProductSchema);

export default Product;
