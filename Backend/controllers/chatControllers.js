const Chat = require("../models/chatModel");
const User = require("../models/userModel"); 

const accessChat = async(req,res)=>{
    const {userId} = req.body;
    if(!userId){
        console.log("userId param not sent with the request");
        return res.sendStatus(400);
    }
    var isChat = await Chat.find({
        isGroupChat:false,
        $and:[
            {users:{$elemMatch:{$eq:req.user._id}}},
            {users:{$elemMatch:{$eq:userId}}}
        ]
    })
    .populate("users","-password").populate("latestMessage");

    isChat = await User.populate(isChat,{
        path:'latestMessage.sender',
        select:'name pic email',
    });

    if (isChat.length > 0){
        res.send(isChat[0]);
    }else{
        var chatData = {
            chatName: 'sender',
            isGroupChat:false,
            users:[req.user._id,userId],  
        };

        try{
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({_id:createdChat._id}).populate("users","-password");
            res.status(200).send(FullChat);
        }catch(error){
            res.status(400);
            throw new Error(error.message);
        }
    }
};   

const fetchChat  = async(req,res)=>{
try{
    Chat.find({users:{$elemMatch:{$eq:req.user._id}}})
    .populate("users","-password")
    .populate("groupAdmin","-password")
    .populate("latestMessage").sort({updatedAt:-1}).then(async(result)=>{
        result = await User.populate(result,{
            path:"latestMessage.sender",
            select:"name email pic"
        });
        res.send(result);
    });
}catch(error){
    console.log("fetchChat Error");
    res.send("Error in fetch Chats");
    throw new Error(error.message);
}
};

const createGroupChat = async(req,res)=>{
    if(!req.body.users || !req.body.name){
        return res.status(400).send({message:"Please fill all the Fields"})
    }
    var users = JSON.parse(req.body.users);

    if(users.length < 2){
        return res.status(400).send("More than 2 users are required for a group");
    }

    users.push(req.user);

    try{
        const groupChat = await Chat.create({
            chatName:req.body.name,
            users: users,
            isGroupChat:true,
            groupAdmin:req.user,
    });
    const fullGroupChat = await Chat.findById({_id:groupChat._id})
    .populate("users","-password")
    .populate("groupAdmin","-password");
    res.status(200).json(fullGroupChat);

    }catch(error){
        res.status(400).send("error could not create the group chat");
        throw new Error(error.message);
    }
}

const renameGroup = async(req,res)=>{
    const {chatId,chatName} = req.body;
     
    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,{
            chatName,
        },{
            new:true,  // if new:true is not given then the chat would give us the old group name itself instead of the newly assigned name
        }
    ).populate("users","-password")
     .populate("groupAdmin","-password");

     if(!updatedChat){
        res.status(400);
        throw new Error("chat not found");
     }else{
        res.json(updatedChat);
     }
}

const addToGroup = async(req,res)=>{
    const {chatId,userId} = req.body;

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push:{users:userId},
        },{
            new:true
        }
    )   
    .populate("users","-password")
    .populate("groupAdmin","-password");

    if(!added){
        res.status(404);
        throw new Error("Chat Not Found");
    }else{
        res.status(200).json(added);
    }
}

const removeFromGroup = async(req,res)=>{
    const {chatId,userId} = req.body;

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull:{users:userId},
        },{
            new:true
        }
    )   
    .populate("users","-password")
    .populate("groupAdmin","-password");

    if(!removed){
        res.status(404);
        throw new Error("Chat Not Found");
    }else{
        res.status(200).json(removed);
    }
}

module.exports = {
    accessChat,
    fetchChat,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup
}; 