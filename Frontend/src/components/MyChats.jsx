import React, { useState, useEffect } from 'react';
import { ChatState } from '../Context/chatProvider';
import { useCustomToast } from "../components/Miscellaneous/Toast";
import axios from 'axios';
import './MyChats.css';
import GroupChatModal from '../components/Miscellaneous/GroupChatModal'; // import your modal

const Backend = import.meta.env.VITE_BACKEND_URL;
const Cloudinary = import.meta.env.VITE_CLOUDINARY_URL;

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); // <-- add modal state
  const { user, selectedChat, setSelectedChat, chats, setChats } = ChatState();
  const { showToast } = useCustomToast();

  const fetchChats = async () => {
    if (!user) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`${Backend}/api/chats`, config);
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      showToast({
        title: "Error Occurred!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-left",
      });
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    setLoggedUser(storedUser);
    fetchChats();
  }, [fetchAgain, user]);

  const getChatDetails = (chat) => {
    if (chat.isGroupChat) {
      return {
        name: chat.chatName,
        email: "Group Chat",
        pic: "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
      };
    } else {
      if (!Array.isArray(chat.users)) {
        return {
          name: "Unknown User",
          email: "Unknown",
          pic: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        };
      }

      const otherUser = chat.users.find((u) => u._id !== loggedUser?._id);

      // Ensure pic URL uses HTTPS
      let pic = otherUser?.pic || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
      
      // Force HTTPS for Cloudinary URLs
      if (pic.startsWith("http://res.cloudinary.com")) {
        pic = pic.replace("http://", "https://");
      }

      return {
        name: otherUser?.name || "Unknown",
        email: otherUser?.email || "Unknown",
        pic,  // Use the updated pic with HTTPS
      };
    }
  };

  return (
    <div className="myChatsContainer">
      <div className="myChatsHeader">
        <h2>My Chats</h2>
        <button
          className="createGroupBtn"
          onClick={() => setIsGroupModalOpen(true)} // <-- open modal
        >
          + Create New Group
        </button>
      </div>

      <div className="chatsList">
        {chats.length > 0 ? (
          chats.map((chat) => {
            const { name, email, pic } = getChatDetails(chat);
            return (
              <div
                key={chat._id}
                className={`chatCard ${selectedChat?._id === chat._id ? "selectedChat" : ""}`}
                onClick={() => setSelectedChat(chat)}
              >
                <img src={pic} alt={name} className="chatImage" />
                <div className="chatInfo">
                  <div className="chatName">{name}</div>
                  <div className="chatEmail">{email}</div>
                </div>
              </div>
            );
          })
        ) : (
          <p>No chats found</p>
        )}
      </div>

      {/* Group Chat Modal */}
      <GroupChatModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
};

export default MyChats;
