import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_PROJECT_CHAT_MESSAGES, SEND_CHAT_MESSAGE } from '../graphql/queries';
import './ProjectChatbot.css';

/**
 * Chatbot component for project-related suggestions and Q&A
 */
function ProjectChatbot({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data, refetch } = useQuery(GET_PROJECT_CHAT_MESSAGES, {
    variables: { projectId },
    skip: !projectId,
  });

  const [sendChatMessage] = useMutation(SEND_CHAT_MESSAGE, {
    onCompleted: (data) => {
      setIsLoading(false);
      if (data.sendChatMessage.success) {
        refetch();
      }
    },
    onError: (error) => {
      setIsLoading(false);
      console.error('Chat error:', error);
    },
  });

  // Initialize messages from query
  useEffect(() => {
    if (data?.project?.chatMessages) {
      setMessages(data.project.chatMessages);
    }
  }, [data]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    const userMessage = inputValue;
    setInputValue('');

    try {
      await sendChatMessage({
        variables: {
          projectId,
          message: userMessage,
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      setMessages([]);
      setInputValue('');
      refetch();
    }
  };

  const suggestedQuestions = [
    'What can I improve?',
    'Code quality analysis',
    'Performance tips',
    'Security suggestions',
  ];

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className={`chatbot-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="chatbot-header">
        <div className="header-content">
          <div className="header-info">
            <h3 className="chatbot-title">💬 AI Assistant</h3>
            <p className="chatbot-subtitle">Get insights about your project</p>
          </div>
          {messages.length > 0 && (
            <span className="message-count">{messages.length}</span>
          )}
        </div>
        <div className="header-actions">
          {messages.length > 0 && (
            <button
              className="icon-btn clear-btn"
              onClick={handleClearChat}
              title="Clear conversation"
              aria-label="Clear chat"
            >
              🗑️
            </button>
          )}
          <button
            className={`icon-btn expand-btn ${isExpanded ? 'collapsed' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize' : 'Expand'}
            aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
          >
            {isExpanded ? '⌄' : '^'}
          </button>
        </div>
      </div>

      <div className="chatbot-messages-container">
        {messages.length === 0 ? (
          <div className="chatbot-empty-state">
            <div className="empty-state-icon">🤖</div>
            <h4>Start a Conversation</h4>
            <p>Ask questions about your project or request suggestions</p>
            <div className="suggested-questions">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  className="suggested-btn"
                  onClick={() => handleSuggestedQuestion(question)}
                  type="button"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`message-wrapper ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content-wrapper">
                  <div
                    className={`message-content ${msg.role === 'user' ? 'user' : 'bot'}`}
                  >
                    {msg.content}
                  </div>
                  <span className="message-time">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-wrapper bot-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content-wrapper">
                  <div className="message-content bot typing">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chatbot-form">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question or request suggestions..."
            disabled={isLoading}
            className="chatbot-input"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-btn"
            title="Send message"
            aria-label="Send"
          >
            {isLoading ? (
              <span className="send-spinner"></span>
            ) : (
              <span className="send-icon">➤</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectChatbot;
