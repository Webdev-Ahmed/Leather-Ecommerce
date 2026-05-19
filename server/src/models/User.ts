import { model } from "mongoose";
import { UserSchema, type IUser } from "../schemas/user.schema";

const User = model<IUser>("User", UserSchema);

export default User;
