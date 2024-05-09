require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncError";
import Jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs"; 
import path from "path";
import sendMail from "../utils/mailSend";
import { sendToken } from "../utils/jwt";
import { stringify } from "querystring";

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
      const { name, email, password } = req.body;

      const isEmailExist = await userModel.findOne({ email });
      //validation: email exist already or not
      if (isEmailExist) {
        return next(new ErrorHandler("Email is already in use", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activation your account",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
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

  return { token, activationCode };
};

//Activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = Jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }
      //otherwise
      const { name, email, password } = newUser.user;
      const existUser = await userModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler("User already exist", 400));
      }
      const user = await userModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({
        success: true,
        message: "User register successful",
        user
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//Login user
interface ILoginRequest {
  email:string;
  password:string;
}

export const loginUser = catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
 try {
  const {email,password}=req.body as ILoginRequest;

  if(!email || !password){
    return next(new ErrorHandler("Please enter email and password", 400));
  };

  const user = await userModel.findOne({email}).select("+password");
  if(!user){
    return next(new ErrorHandler("Invalid email or password", 400));
  };
  const isPasswordMatch = await user.comparePassword(password);
  if(!isPasswordMatch){
    return next(new ErrorHandler("Invalid email or password", 400));
  }

  sendToken(user, 200 ,res);
  
 } catch (error:any) {
  return next(new ErrorHandler(error.message, 400));
 }
})


//Logout user
export const logoutUser = catchAsyncError(
  async (req:Request,res:Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", {maxAge:1});
      res.cookie("refresh_token", "", {maxAge:1});
      res.status(200).json({
        message:"Logged out successfully",
      })
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
)