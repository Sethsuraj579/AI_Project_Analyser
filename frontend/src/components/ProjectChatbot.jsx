import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_PROJECT_CHAT_MESSAGES, SEND_CHAT_MESSAGE } from '../graphql/queries';

/**
 * Chatbot component for project-related suggestions and Q&A
 */
function ProjectChatbot({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data, refetch } = useQuery(GET_PROJECT_CHAT_MESSAGES, {
    variables: { projectId },
    skip: !projectId,
  });

  const [sendChatMessage] = useMutation(SEND_CHAT_MESSAGE, {
    onCompleted: (data) => {
      setIsLoading(false);
      if (data.sendChatMessage.success) {
        // Refetch messages to get the latest
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
    setMessages([]);
    setInputValue('');
    refetch();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h3 style={styles.title}>Project Chatbot</h3>
            <p style={styles.subtitle}>Get suggestions and insights about your project</p>
          </div>
          <button 
            onClick={handleClearChat}
            style={styles.clearButton}
            title="Clear chat history"
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No messages yet. Start a conversation!</p>
            <p style={styles.emptyHint}>Try asking for project improvements or suggestions.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.messageWrapper,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  ...styles.message,
                  backgroundColor: msg.role === 'user' ? '#00d4ff' : '#1a1f36',
                  color: msg.role === 'user' ? '#000' : '#fff',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={styles.inputForm}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question or request suggestions..."
          disabled={isLoading}
          style={styles.input}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
            ...styles.button,
            opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '500px',
    backgroundColor: '#0f1419',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  clearButton: {
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  subtitle: {
    margin: 0,
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '8px',
  },
  messageWrapper: {
    display: 'flex',
    gap: '8px',
  },
  message: {
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: '8px',
    wordWrap: 'break-word',
    fontSize: '14px',
    lineHeight: '1.4',
  },
  inputForm: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#00d4ff',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default ProjectChatbot;
