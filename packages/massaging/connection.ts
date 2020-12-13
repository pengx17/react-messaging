import { TMessage } from './types';

export class Connection<
  MessageType extends string = string,
  Message extends TMessage = TMessage<MessageType, any>
> {
  constructor(private peer: Window) {}

  send(message: Message) {
    // TODO: fix '*' here
    this.peer.postMessage(JSON.stringify(message), '*');
  }

  subscribe<MT extends MessageType>(
    messageTypeOrTypes: MT | MT[],
    handler: (err: any, message?: extends) => void
  ) {
    const h = (e: MessageEvent) => {
      if (e.source === this.peer) {
        try {
          const message = JSON.parse(e.data);
          const mts = Array.isArray(messageTypeOrTypes)
            ? messageTypeOrTypes
            : [messageTypeOrTypes];
          if (mts.includes(message.type)) {
            handler(null, message);
            Debug.info(
              `${window.origin}: Message recv <| [${
                message.type
              }  ${JSON.stringify((message as any).payload ?? '')}]`
            );
          }
        } catch (err) {
          handler(err);
        }
      }
    };
    window.addEventListener('message', h);

    // Returns unsubscription
    return () => {
      window.removeEventListener('message', h);
    };
  }

  wait<MT extends TSDKMessageType>(
    messageTypeOrTypes: MT | MT[],
    signal?: AbortSignal
  ) {
    return new Promise<TGetMessage<MT> | undefined>((res, rej) => {
      let unsub: (() => void) | null = null;
      const doUnsub = () => {
        unsub?.();
        unsub = null;
      };
      const handleAbort = () => {
        doUnsub();
        Debug.info(`Message aborted! ${messageTypeOrTypes}}`);
        rej(new Error('AbortError'));
      };

      if (signal) {
        if (signal.aborted) {
          handleAbort();
        } else {
          signal.onabort = handleAbort;
        }
      }

      unsub = this.subscribe(messageTypeOrTypes, (err, p) => {
        if (err) {
          rej(err);
        } else {
          res(p);
        }
        doUnsub();
      });
    });
  }

  ask<M extends TSDKMessage, MT extends TSDKMessageType>(
    message: M,
    messageTypeOrTypes: MT | MT[],
    signal?: AbortSignal
  ) {
    this.send(message);
    return this.wait(messageTypeOrTypes, signal);
  }
}
