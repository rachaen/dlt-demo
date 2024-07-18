import React, { useState, useEffect, useRef, useCallback } from 'react';

const App = () => {
  const [messageCount, setMessageCount] = useState(0);
  const [avgRate, setAvgRate] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const socketRef = useRef(null);
  const startTimeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageQueueRef = useRef([]);
  const batchSize = 20; // 한 번에 처리할 메시지 수
  const updateInterval = 100; // 화면 업데이트 간격 (밀리초)

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length > 0) {
      const batchToProcess = messageQueueRef.current.splice(0, batchSize);
      setMessageCount((prevCount) => prevCount + batchToProcess.length);
      setMessages((prevMessages) => [...prevMessages, ...batchToProcess]);

      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      setAvgRate((messageCount / elapsedTime).toFixed(2));
    }
  }, [messageCount]);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(processMessageQueue, updateInterval);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, processMessageQueue]);

  const startWebSocket = () => {
    socketRef.current = new WebSocket('ws://localhost:9090/websocket');
    socketRef.current.onmessage = (event) => {
      messageQueueRef.current.push(event.data);
    };

    setMessageCount(0);
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
    processMessageQueue(); // 남은 메시지 처리
  };

  return (
    <div className='flex flex-col h-screen p-4'>
      <h1 className='text-2xl font-bold mb-4'>WebSocket Client</h1>
      <div className='flex justify-between mb-4'>
        <div className='text-sm text-gray-600'>
          CNT: <span>{messageCount}</span>
        </div>
        <div className='text-sm text-gray-600'>
          Avg per second: <span>{avgRate}</span>
        </div>
      </div>
      <div className='flex-grow border border-gray-300 overflow-y-auto p-4 mb-4'>
        {messages.map((msg, index) => (
          <div key={index} className='mb-2 pb-2 border-b border-gray-200'>
            {msg}
          </div>
        ))}
        <div ref={messagesEndRef} />
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

export default App;
