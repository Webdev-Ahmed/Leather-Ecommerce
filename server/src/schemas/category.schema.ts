import { Schema, type Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);
