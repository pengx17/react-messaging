import type { TMessage } from '@pengx17/react-messaging/core';

type TDemoMessage<
  Type extends `@demo/${string}`,
  Payload = undefined
> = TMessage<Type, Payload>;

export type TDemoIncr = TDemoMessage<'@demo/incr'>;
export type TDemoIncrAck = TDemoMessage<'@demo/incr-ack', number>;

export type TDemoDecr = TDemoMessage<'@demo/decr'>;
export type TDemoDecrAck = TDemoMessage<'@demo/decr-ack', number>;

export type TDemoMessages = TDemoIncr | TDemoDecr | TDemoIncrAck | TDemoDecrAck;
