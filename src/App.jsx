import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

const App = () => {
  const [messageCount, setMessageCount] = useState(0);
  const [avgRate, setAvgRate] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const startTimeRef = useRef(null);
  const listRef = useRef(null);
  const messageQueueRef = useRef([]);
  const batchSize = 20;
  const updateInterval = 100;

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length > 0) {
      const batchToProcess = messageQueueRef.current.splice(0, batchSize);
      setMessageCount((prevCount) => {
        const newCount = prevCount + batchToProcess.length;
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        setAvgRate((newCount / elapsedTime).toFixed(2));
        return newCount;
      });

      setMessages((prevMessages) => [...prevMessages, ...batchToProcess]);
    }
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(processMessageQueue, updateInterval);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, processMessageQueue]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages]);

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

  const Row = ({ index, style }) => (
    <div style={style} className='mb-2 pb-2 border-b border-gray-200'>
      {messages[index]}
    </div>
  );

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
      <div className='flex-grow border border-gray-300 overflow-hidden p-4 mb-4'>
        <List height={400} itemCount={messages.length} itemSize={35} width='100%' ref={listRef}>
          {Row}
        </List>
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
