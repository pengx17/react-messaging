import { Connection } from '@pengx17/react-messaging/core';
import * as React from 'react';
import { render } from 'react-dom';

import { TDemoDecr, TDemoDecrAck, TDemoIncr, TDemoIncrAck } from '../messages';

import '../reset.css';

type InboundMessage = TDemoIncr | TDemoDecrAck;
type OutboundMessage = TDemoIncrAck | TDemoDecr;

const parent = window.parent !== window ? window.parent : null;
const connection = parent
  ? new Connection<InboundMessage, OutboundMessage>('CHILD', parent)
  : null;

const App = () => {
  const [count, setCount] = React.useState<number>(0);
  const handleIncr = async () => {
    const res = await connection?.ask({ type: '@demo/incr' }, '@demo/incr-ack');
    setCount(res?.payload ?? 0);
  };

  React.useEffect(() => {
    return connection?.subscribe('@demo/decr', (_, message) => {
      if (message) {
        setCount((c) => {
          connection.send({ type: '@demo/decr-ack', payload: c - 1 });
          return c - 1;
        });
      }
    });
  }, [connection]);

  return (
    <div>
      {connection && <h1>I am nested !</h1>}
      <button onClick={handleIncr}>Incr</button> {count}
    </div>
  );
};

async function main() {
  if (connection) {
    await connection.handshake();
  }
  render(<App />, document.getElementById('root'));
}

main();
