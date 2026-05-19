import { model } from "mongoose";
import { CategorySchema, type ICategory } from "../schemas/category.schema";

const Category = model<ICategory>("Category", CategorySchema);

export default Category;
