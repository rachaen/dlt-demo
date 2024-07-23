import React, { useState, useEffect, useRef } from 'react';

export default function Table() {
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const messageQueueRef = useRef([]);
  const displaySize = 100;
  const updateInterval = 1000;
  const bufferSize = 5000;

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(processMessageQueue, updateInterval);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    const table = document.getElementById('messageTable');
    if (table) {
      table.scrollTop = table.scrollHeight;
    }
  }, [messages]);

  const processMessageQueue = () => {
    if (messageQueueRef.current.length > 0) {
      const newMessages = [...messages, ...messageQueueRef.current];
      const updatedMessages = newMessages.slice(-bufferSize);
      setMessages(updatedMessages);
      messageQueueRef.current = [];
    }
  };

  const startWebSocket = () => {
    socketRef.current = new WebSocket('ws://localhost:8383/data');
    socketRef.current.onmessage = (event) => {
      const receivedData = event.data.split('\n');
      messageQueueRef.current.push(...receivedData.map((message) => message.trim()));
      if (messageQueueRef.current.length >= displaySize) {
        processMessageQueue();
      }
    };

    setMessages([]);
    messageQueueRef.current = [];
    setIsRunning(true);
  };

  const stopWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    setIsRunning(false);
    processMessageQueue();
  };

  return (
    <>
      <div className='flex-grow border border-gray-300 overflow-auto p-4 mb-4' id='messageTable'>
        <table className='min-w-full bg-white'>
          <thead>
            <tr>
              <th className='py-2'>Message</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                <td className='py-2'>{message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='flex justify-start'>
        <button
          onClick={startWebSocket}
          disabled={isRunning}
          className='mr-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300'
        >
          Start
        </button>
        <button
          onClick={stopWebSocket}
          disabled={!isRunning}
          className='px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300'
        >
          Stop
        </button>
      </div>
    </>
  );
}
