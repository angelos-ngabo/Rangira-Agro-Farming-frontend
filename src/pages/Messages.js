import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import Sidebar from '../components/layout/Sidebar';

import Button from '../components/common/Button';
import { Mail, User, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [subject, setSubject] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [relatedInventory, setRelatedInventory] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Fetch available users for messaging based on user type
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['availableUsers', user?.userType],
    async () => {
      if (!user?.userType) return [];

      try {
        // Storekeepers can message Farmers
        if (user.userType === 'STOREKEEPER') {
          const response = await dataService.getUsersByType('FARMER');
          return response.data || [];
        }

        // Buyers can message Farmers
        if (user.userType === 'BUYER') {
          const response = await dataService.getUsersByType('FARMER');
          return response.data || [];
        }

        // Farmers can message Buyers and Storekeepers
        if (user.userType === 'FARMER') {
          const [buyersResponse, storekeepersResponse] = await Promise.all([
            dataService.getUsersByType('BUYER'),
            dataService.getUsersByType('STOREKEEPER')
          ]);
          const buyers = buyersResponse.data || [];
          const storekeepers = storekeepersResponse.data || [];
          return [...buyers, ...storekeepers];
        }

        return [];
      } catch (error) {
        console.error('Error fetching available users:', error);
        return [];
      }
    },
    { enabled: !!user?.userType }
  );

  React.useEffect(() => {
    if (usersData) {
      setAvailableUsers(usersData);
    }
  }, [usersData]);

  // Get all messages for current user
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useQuery(
    ['messages', user?.id],
    async () => {
      const response = await dataService.getMessagesForUser(user?.id, { page: 0, size: 100 });
      return response.data || response; // Handle both response.data and direct response
    },
    {
      enabled: !!user?.id,
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true
    }
  );

  // Get unread count
  const { data: unreadCount } = useQuery(
    ['unreadCount', user?.id],
    () => dataService.getUnreadMessageCount(user?.id),
    { enabled: !!user?.id, refetchInterval: 30000 }
  );

  // Get conversation
  const { data: conversation, refetch: refetchConversation } = useQuery(
    ['conversation', selectedConversation?.userId1, selectedConversation?.userId2],
    async () => {
      if (!selectedConversation) return [];
      try {
        const response = await dataService.getConversation(selectedConversation.userId1, selectedConversation.userId2);
        return response.data || response || [];
      } catch (error) {
        console.error('Error fetching conversation:', error);
        return [];
      }
    },
    {
      enabled: !!selectedConversation,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
      refetchOnWindowFocus: true
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (data) => dataService.sendMessage(data),
    {
      onSuccess: (response) => {
        toast.success('Message sent successfully');
        setMessageText('');
        setSubject('');
        setShowCompose(false);

        // Invalidate and refetch all message-related queries
        queryClient.invalidateQueries(['messages', user?.id]);
        queryClient.invalidateQueries(['unreadCount', user?.id]);

        // If we have a selected conversation, refetch it
        if (selectedConversation) {
          refetchConversation();
        } else if (response?.data?.receiver?.id) {
          // If we just sent a message, select that conversation
          const receiverId = response.data.receiver.id;
          setSelectedConversation({
            userId1: user?.id,
            userId2: receiverId,
            otherUser: response.data.receiver
          });
        }
      },
      onError: (error) => {
        console.error('Error sending message:', error);
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (messageId) => dataService.markMessageAsRead(messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', user?.id]);
        queryClient.invalidateQueries(['unreadCount', user?.id]);
        if (selectedConversation) {
          refetchConversation();
        }
      }
    }
  );

  // Get unique conversations with initiator info
  const conversations = React.useMemo(() => {
    if (!messagesData?.data?.content && !messagesData?.content) return [];

    const messages = messagesData?.data?.content || messagesData?.content || [];

    const conversationMap = new Map();
    const initiatorMap = new Map(); // Track who initiated each conversation

    messages.forEach((message) => {
      // Skip messages with missing sender or receiver
      if (!message.sender || !message.receiver || !message.sender.id || !message.receiver.id) {
        console.warn('Skipping message with missing sender or receiver:', message);
        return;
      }

      const otherUser = message.sender.id === user?.id ? message.receiver : message.sender;
      const key = `${Math.min(message.sender.id, message.receiver.id)}-${Math.max(message.sender.id, message.receiver.id)}`;

      if (!conversationMap.has(key)) {
        // Find the first message to determine initiator
        const firstMessage = messages
          .filter(m => {
            const mOtherUser = m.sender.id === user?.id ? m.receiver : m.sender;
            const mKey = `${Math.min(m.sender.id, m.receiver.id)}-${Math.max(m.sender.id, m.receiver.id)}`;
            return mKey === key;
          })
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

        const initiator = firstMessage?.sender?.id === user?.id ? 'You' : firstMessage?.sender;

        conversationMap.set(key, {
          otherUser,
          lastMessage: message,
          unreadCount: 0,
          userId1: message.sender.id,
          userId2: message.receiver.id,
          initiator: initiator,
          initiatorId: firstMessage?.sender?.id,
          messageCount: 0,
        });
      }

      const conv = conversationMap.get(key);
      conv.messageCount++;

      if (new Date(message.createdAt) > new Date(conv.lastMessage.createdAt)) {
        conv.lastMessage = message;
      }
      if (!message.isRead && message.receiver.id === user?.id) {
        conv.unreadCount++;
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );
  }, [messagesData, user?.id]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation({
      userId1: conversation.userId1,
      userId2: conversation.userId2,
      otherUser: conversation.otherUser,
    });
    setShowCompose(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !subject.trim()) {
      toast.error('Please enter both subject and message');
      return;
    }

    const receiverId = showCompose ? selectedUser?.id : selectedConversation?.otherUser?.id;

    if (!receiverId) {
      toast.error('Please select a recipient');
      return;
    }

    // If replying to a conversation, try to find the last message to reply to
    let repliedToMessageId = null;
    if (selectedConversation && conversation && conversation.length > 0) {
      // Find the last message in the conversation (most recent)
      const sortedMessages = [...conversation].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      if (sortedMessages.length > 0 && sortedMessages[0].id) {
        repliedToMessageId = sortedMessages[0].id;
      }
    }

    sendMessageMutation.mutate({
      receiverId,
      subject,
      content: messageText,
      relatedInventoryId: relatedInventory?.id || null,
      repliedToMessageId: repliedToMessageId,
    });
  };

  const handleComposeNew = () => {
    setShowCompose(true);
    setSelectedConversation(null);
    setSelectedUser(null);
    setSubject('');
    setMessageText('');
  };

  // Auto-scroll to bottom when conversation changes or new messages arrive
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, selectedConversation]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversation && selectedConversation && Array.isArray(conversation)) {
      conversation.forEach((message) => {
        if (message && message.receiver && message.receiver.id && !message.isRead && message.receiver.id === user?.id) {
          markAsReadMutation.mutate(message.id);
        }
      });
    }
  }, [conversation, selectedConversation, user?.id]);

  // Filter conversations based on user type
  const filteredConversations = React.useMemo(() => {
    if (!conversations) return [];

    // Storekeepers can only see conversations with Farmers
    if (user?.userType === 'STOREKEEPER') {
      return conversations.filter(conv => conv.otherUser.userType === 'FARMER');
    }

    // Buyers can only see conversations with Farmers
    if (user?.userType === 'BUYER') {
      return conversations.filter(conv => conv.otherUser.userType === 'FARMER');
    }

    // Farmers can see conversations with Buyers and Storekeepers
    if (user?.userType === 'FARMER') {
      return conversations.filter(conv =>
        conv.otherUser.userType === 'BUYER' || conv.otherUser.userType === 'STOREKEEPER'
      );
    }

    return conversations;
  }, [conversations, user?.userType]);

  // Check if user can access messages (not admin)
  if (user?.userType === 'ADMIN') {
    return (
      <div className="messages-page">
        <Sidebar />

        <div className="messages-content">
          <div className="messages-error">
            <Mail size={48} />
            <h2>Access Restricted</h2>
            <p>Admin users cannot access the messaging system.</p>
            <p>Messages are only available between Buyers, Farmers, and Storekeepers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <Sidebar />
      <div className="messages-content">
        <div className="messages-header">
          <h1>Messages</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
          <Button onClick={handleComposeNew} icon={Mail} iconPosition="left">
            New Message
          </Button>
        </div>

        <div className="messages-container">
          <div className="messages-sidebar">
            <h2>Conversations</h2>
            {messagesLoading ? (
              <div className="loading">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="empty-state">
                <Mail size={48} />
                <p>No conversations yet</p>
                <Button onClick={handleComposeNew} variant="outline" size="small">
                  Start a conversation
                </Button>
              </div>
            ) : (
              <div className="conversations-list">
                {filteredConversations.map((conv) => (
                  <div
                    key={`${conv.userId1}-${conv.userId2}`}
                    className={`conversation-item ${selectedConversation?.userId1 === conv.userId1 &&
                      selectedConversation?.userId2 === conv.userId2
                      ? 'active'
                      : ''
                      }`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="conversation-avatar">
                      <User size={20} />
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3>
                            {conv.otherUser.firstName} {conv.otherUser.lastName}
                          </h3>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#f0f0f0',
                            color: '#666',
                            textTransform: 'uppercase',
                            fontWeight: 500
                          }}>
                            {conv.otherUser.userType}
                          </span>
                          {conv.initiator && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: conv.initiatorId === user?.id ? '#e3f2fd' : '#fff3e0',
                              color: conv.initiatorId === user?.id ? '#1976d2' : '#f57c00',
                              fontStyle: 'italic'
                            }}>
                              {conv.initiatorId === user?.id ? 'You started' : `${conv.initiator?.firstName || 'They'} started`}
                            </span>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="unread-dot">{conv.unreadCount}</span>
                        )}
                      </div>
                      <p className="conversation-preview">
                        {conv.lastMessage.subject}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span className="conversation-time">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                        </span>
                        {conv.messageCount > 1 && (
                          <span style={{
                            fontSize: '11px',
                            color: '#999',
                            background: '#f0f0f0',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {conv.messageCount} messages
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="messages-main">
            {showCompose ? (
              <div className="compose-message">
                <h2>Compose New Message</h2>
                <form onSubmit={handleSendMessage}>
                  <div className="form-group">
                    <label>
                      To (Select a {
                        user?.userType === 'STOREKEEPER'
                          ? 'Farmer'
                          : user?.userType === 'BUYER'
                            ? 'Farmer'
                            : user?.userType === 'FARMER'
                              ? 'Buyer or Storekeeper'
                              : 'Recipient'
                      })
                    </label>
                    {usersLoading ? (
                      <div>Loading users...</div>
                    ) : (
                      <select
                        value={selectedUser?.id || ''}
                        onChange={(e) => {
                          const userId = parseInt(e.target.value);
                          const user = availableUsers.find(u => u.id === userId);
                          setSelectedUser(user || null);
                        }}
                        required
                      >
                        <option value="">Select recipient...</option>
                        {availableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.userType})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={10}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <Button type="submit" icon={Mail} loading={sendMessageMutation.isLoading}>
                      Send Message
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCompose(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            ) : selectedConversation ? (
              <div className="conversation-view">
                <div className="conversation-header-view">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2>
                      Conversation with {selectedConversation.otherUser.firstName}{' '}
                      {selectedConversation.otherUser.lastName}
                    </h2>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}>
                      {selectedConversation.otherUser.userType}
                    </span>
                  </div>
                </div>
                <div className="messages-list">
                  {conversation && Array.isArray(conversation) && conversation.length > 0 ? (
                    (() => {
                      // Sort messages by creation time
                      const sortedMessages = conversation
                        .filter(message => message && message.sender && message.receiver)
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                      // Build message threads (group replies with their parent messages)
                      const messageMap = new Map();
                      const rootMessages = [];

                      sortedMessages.forEach(message => {
                        messageMap.set(message.id, { ...message, replies: [] });
                      });

                      sortedMessages.forEach(message => {
                        if (message.repliedToMessageId && messageMap.has(message.repliedToMessageId)) {
                          // This is a reply
                          messageMap.get(message.repliedToMessageId).replies.push(messageMap.get(message.id));
                        } else {
                          // This is a root message
                          rootMessages.push(messageMap.get(message.id));
                        }
                      });

                      return (
                        <>
                          {rootMessages.map((rootMessage) => (
                            <div key={rootMessage.id} className="message-thread">
                              {/* Root Message */}
                              <div
                                className={`message-item ${rootMessage.sender?.id === user?.id ? 'sent' : 'received'
                                  } ${!rootMessage.isRead && rootMessage.receiver?.id === user?.id ? 'unread' : ''}`}
                              >
                                <div className="message-header">
                                  <div className="message-sender-info">
                                    <strong>
                                      {rootMessage.sender?.id === user?.id
                                        ? 'You'
                                        : `${rootMessage.sender?.firstName || 'Unknown'} ${rootMessage.sender?.lastName || ''}`}
                                    </strong>
                                    {rootMessage.sender?.id !== user?.id && (
                                      <span className="message-sender-type">
                                        {rootMessage.sender?.userType}
                                      </span>
                                    )}
                                  </div>
                                  <span className="message-time">
                                    {rootMessage.createdAt ? new Date(rootMessage.createdAt).toLocaleString() : ''}
                                  </span>
                                </div>
                                <div className="message-subject">{rootMessage.subject || ''}</div>
                                <div className="message-content">{rootMessage.content || ''}</div>
                                {rootMessage.relatedInventory && (
                                  <div className="message-inventory">
                                    <Package size={16} />
                                    <span>Related to: {rootMessage.relatedInventory.inventoryCode || 'N/A'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Replies */}
                              {rootMessage.replies && rootMessage.replies.length > 0 && (
                                <div className="message-replies">
                                  {rootMessage.replies.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className={`message-item reply ${reply.sender?.id === user?.id ? 'sent' : 'received'
                                        } ${!reply.isRead && reply.receiver?.id === user?.id ? 'unread' : ''}`}
                                    >
                                      <div className="message-header">
                                        <div className="message-sender-info">
                                          <strong>
                                            {reply.sender?.id === user?.id
                                              ? 'You'
                                              : `${reply.sender?.firstName || 'Unknown'} ${reply.sender?.lastName || ''}`}
                                          </strong>
                                          {reply.sender?.id !== user?.id && (
                                            <span className="message-sender-type">
                                              {reply.sender?.userType}
                                            </span>
                                          )}
                                        </div>
                                        <span className="message-time">
                                          {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}
                                        </span>
                                      </div>
                                      <div className="message-subject">{reply.subject || ''}</div>
                                      <div className="message-content">{reply.content || ''}</div>
                                      {reply.relatedInventory && (
                                        <div className="message-inventory">
                                          <Package size={16} />
                                          <span>Related to: {reply.relatedInventory.inventoryCode || 'N/A'}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      );
                    })()
                  ) : (
                    <div className="empty-state">No messages in this conversation</div>
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="message-reply">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Subject (e.g., Re: [previous subject])"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <textarea
                      placeholder="Type your reply..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Button type="submit" icon={Mail} loading={sendMessageMutation.isLoading}>
                      Send Reply
                    </Button>
                    {conversation && conversation.length > 0 && (
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        Replying to: {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="empty-conversation">
                <Mail size={64} />
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar to view messages</p>
                <Button onClick={handleComposeNew} variant="outline">
                  Start New Conversation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;

