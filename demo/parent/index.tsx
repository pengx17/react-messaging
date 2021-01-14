import { IFrame } from '@pengx17/react-messaging/components';
import { Connection } from '@pengx17/react-messaging/core';
import * as React from 'react';
import { render } from 'react-dom';
import { TDemoDecr, TDemoDecrAck, TDemoIncr, TDemoIncrAck } from '../messages';
import '../reset.css';

type OutboundMessage = TDemoIncr | TDemoDecrAck;
type InboundMessage = TDemoIncrAck | TDemoDecr;

const App = () => {
  const [connection, setConnection] = React.useState<
    Connection<InboundMessage, OutboundMessage>
  >();
  const [count, setCount] = React.useState<number>(0);
  const handleDecr = async () => {
    const res = await connection?.ask({ type: '@demo/decr' }, '@demo/decr-ack');
    setCount(res?.payload ?? 0);
  };

  React.useEffect(() => {
    return connection?.subscribe('@demo/incr', (_, message) => {
      if (message) {
        setCount((c) => {
          connection.send({ type: '@demo/incr-ack', payload: c + 1 });
          return c + 1;
        });
      }
    });
  }, [connection]);

  return (
    <div>
      <h1>I am parent:</h1>
      <button onClick={handleDecr}>Decr</button> {count}
      <IFrame
        onConnected={setConnection}
        src="http://localhost:1235"
        style={{ height: '500px', width: '100vw', boxShadow: '0 0 5px' }}
      />
    </div>
  );
};

render(<App />, document.getElementById('root'));
