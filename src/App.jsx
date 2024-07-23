import React from 'react';
import ReactWindow from './ReactWindow.jsx';
import Table from './Table.jsx';

const App = () => (
  <div className='flex flex-col h-screen p-4'>
    <h1 className='text-2xl font-bold mb-4'>WebSocket Client</h1>
    <Table />
    {/* <ReactWindow /> */}
  </div>
);
export default App;
