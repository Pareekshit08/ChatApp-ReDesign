const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async(req,res,next)=>{
    let token;

    if(
        req.headers.authorization && 
        req.headers.authorization.startsWith("Bearer")
    ){
        try{
            token = req.headers.authorization.split(" ")[1];

            if(!token){
                res.status(401).json({msg:"NO token, authoriztion failed!"});
                return;
            }
            
            //decodes token id;
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            console.log(decoded);

            req.user = await User.findById(decoded.id).select("-password");

            next();
        }catch(error){
            res.status(401).json({msg:"User not authorized or server error!!!"});
            // throw new Error("Not authorized, token failed");
        }
    }else{
        res.status(401).json({msg:"User not authorized"});
    }
}

module.exports = {protect};