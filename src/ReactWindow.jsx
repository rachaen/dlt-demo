import React, { useState, useEffect, useRef, useCallback } from 'react';

const ReactWindow = () => {
  const [messageCount, setMessageCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [avgRate, setAvgRate] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const startTimeRef = useRef(null);
  const messageQueueRef = useRef([]);
  const bufferSize = 100;
  const updateInterval = 1000;
  const maxDisplayMessages = 1000;

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length > 0) {
      const newMessages = [...messages, ...messageQueueRef.current];
      const updatedMessages = newMessages.slice(-maxDisplayMessages);
      setMessages(updatedMessages);
      setMessageCount((prevCount) => prevCount + messageQueueRef.current.length);
      setDisplayedCount(updatedMessages.length);
      messageQueueRef.current = [];
    }
    const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
    setAvgRate((messageCount / elapsedTime).toFixed(2));
  }, [messages, messageCount]);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(processMessageQueue, updateInterval);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, processMessageQueue]);

  useEffect(() => {
    const table = document.getElementById('messageTable');
    if (table) {
      table.scrollTop = table.scrollHeight;
    }
  }, [messages]);

  const startWebSocket = () => {
    socketRef.current = new WebSocket('ws://localhost:8383/data');
    socketRef.current.onmessage = (event) => {
      const receivedData = event.data.split('\n');
      messageQueueRef.current.push(...receivedData.map((message) => message.trim()));
      if (messageQueueRef.current.length >= bufferSize) {
        processMessageQueue();
      }
    };

    setMessageCount(0);
    setDisplayedCount(0);
    setAvgRate(0);
    setMessages([]);
    messageQueueRef.current = [];
    startTimeRef.current = Date.now();
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
    <div className='flex flex-col h-screen p-4'>
      <h1 className='text-2xl font-bold mb-4'>WebSocket Client</h1>
      <div className='flex justify-between mb-4'>
        <div className='text-sm text-gray-600'>
          Total received: <span>{messageCount}</span>
        </div>
        <div className='text-sm text-gray-600'>
          Displayed: <span>{displayedCount}</span>
        </div>
        <div className='text-sm text-gray-600'>
          Avg per second: <span>{avgRate}</span>
        </div>
      </div>
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
    </div>
  );
};

export default ReactWindow;
