require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncError";
import  Jwt,{Secret } from "jsonwebtoken";
import ejs from "ejs"; //install this dependency
import path from 'path'
import sendMail from "../utils/mailSend";


// register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //fetching email from req body
      const { name, email, password } = req.body;
      const isEmailExist = await userModel.findOne({ email });

      //validation: email exist already or not
      if (isEmailExist) {
        return next(new ErrorHandler("Email is already exist", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = {user:{name:user.name}, activationCode}
      const html = await ejs.renderFile(path.join(__dirname,"../mails/activation-mail.ejs"), data)

      try {
        await sendMail({
          email:user.email,
          subject:"Activation your account",
          template:"activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success:true,
          message:`Please check your email: ${user.email} to activate your account`,
          activationToken:activationToken.token,
        });
        
      } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
      }


    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);



interface IActivationToken {
  token: string;
  activationCode: string;
}

const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = Jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return {token,activationCode};
};
