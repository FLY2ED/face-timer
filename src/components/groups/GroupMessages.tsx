import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { Message, User } from "@/types";
import { users as mockUsers, messages as mockMessages } from "@/data/mockData";

interface GroupMessagesProps {
  groupId: string;
  members: User[];
}

const MOCK_CURRENT_USER_ID = mockUsers[0]?.id || "user1";

export const GroupMessages = ({ groupId, members }: GroupMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      console.log(`Fetching messages for groupId: ${groupId} (local)`);
      const filteredMessages = mockMessages.filter(msg => msg.groupId === groupId);
      
      const populatedMessages: Message[] = filteredMessages.map(msg => {
        const member = members.find(m => m.id === msg.userId);
        return {
          ...msg,
          userName: member?.name || msg.userName || 'Unknown User',
          userAvatar: member?.avatar || msg.userAvatar,
        };
      });
      setMessages(populatedMessages);
    };

    fetchMessages();
  }, [groupId, members]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !groupId) return;
    
    try {
      const newMessage: Message = {
        id: `local-msg-${Date.now()}`,
        groupId: groupId,
        userId: MOCK_CURRENT_USER_ID,
        userName: mockUsers.find(u => u.id === MOCK_CURRENT_USER_ID)?.name || "나",
        userAvatar: mockUsers.find(u => u.id === MOCK_CURRENT_USER_ID)?.avatar,
        content: messageText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessageText("");
      console.log("Message sent (local):", newMessage);
    } catch (error) {
      console.error("Error sending message (local):", error);
    }
  };

  const getUserName = (userId: string) => {
    const member = members.find(m => m.id === userId);
    return member?.name || "Unknown User";
  };
  
  const getUserAvatar = (userId: string) => {
    const member = members.find(m => m.id === userId);
    return member?.avatar;
  };

  return (
    <div className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              아직 메시지가 없습니다. 첫 메시지를 보내보세요!
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.userId === MOCK_CURRENT_USER_ID;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getUserAvatar(message.userId)} />
                        <AvatarFallback>{getUserName(message.userId).substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {!isCurrentUser && (
                        <p className="text-xs text-zinc-400 mb-1">{getUserName(message.userId)}</p>
                      )}
                      <div className={`rounded-2xl px-4 py-2 ${
                        isCurrentUser ? 'bg-orange-600 text-white' : 'bg-zinc-700 text-white'
                      }`}>
                        <p>{message.content}</p>
                      </div>
                      <p className={`text-xs text-zinc-500 mt-1 ${isCurrentUser ? 'text-right' : ''}`}>
                        {format(message.timestamp, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-zinc-700 bg-zinc-800">
        <div className="flex gap-2">
          <Input
            placeholder="메시지를 입력하세요..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-zinc-700 border-zinc-600 text-white"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};
