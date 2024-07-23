import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export default function ReactWindow() {
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const listRef = useRef();
  const bufferRef = useRef([]);
  const maxBufferSize = 10000;
  const updateInterval = 100; // 100ms for more frequent updates
  const maxDisplayedMessages = 100000; // Adjust based on your needs

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length > 0) {
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, ...bufferRef.current];
        bufferRef.current = [];
        return newMessages.slice(-maxDisplayedMessages);
      });
    }
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(flushBuffer, updateInterval);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, flushBuffer]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages]);

  const startWebSocket = () => {
    socketRef.current = new WebSocket('ws://localhost:8383/data');
    socketRef.current.onmessage = (event) => {
      const receivedData = event.data.split('\n');
      bufferRef.current.push(...receivedData.map((message) => message.trim()));

      if (bufferRef.current.length > maxBufferSize) {
        bufferRef.current = bufferRef.current.slice(-maxBufferSize);
      }
    };

    setMessages([]);
    bufferRef.current = [];
    setIsRunning(true);
  };

  const stopWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    setIsRunning(false);
    flushBuffer();
  };

  const Row = ({ index, style }) => (
    <div style={style} className={`p-2 ${index % 2 ? 'bg-gray-100' : 'bg-white'}`}>
      {messages[index]}
    </div>
  );

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex-grow border border-gray-300 overflow-hidden'>
        <AutoSizer>
          {({ height, width }) => (
            <List
              className='List'
              height={height}
              itemCount={messages.length}
              itemSize={35}
              width={width}
              ref={listRef}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
      <div className='flex justify-start mt-4'>
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
}
