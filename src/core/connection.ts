import { InferMessageFromType, InferMessageType, TMessage } from './types';

const PARENT_READY = '__$$PARENT_READY$$__';
const CHILD_READY = '__$$CHILD_READY$$__';

function messageToString(message: TMessage) {
  if (!(message as any).payload) {
    return `[${message.type}]`;
  } else {
    return `[${message.type}, {${(message as any).payload}}]`;
  }
}

export class Connection<
  OutboundMessage extends TMessage = TMessage<string, any>,
  InboundMessage extends TMessage = TMessage<string, any>
> {
  private ready$: Promise<void> | null = null;
  private readyResRej!: {
    resolver: () => void;
    rejector: (err: any) => void;
  };
  constructor(private role: 'PARENT' | 'CHILD', private peer: Window) {}

  async handshake(signal?: AbortSignal) {
    if (this.ready$) {
      return this.ready$;
    }
    this.ready$ = new Promise((res, rej) => {
      this.readyResRej = {
        resolver: res,
        rejector: rej,
      };
    });
    try {
      if (this.role === 'PARENT') {
        await this.ask(
          { type: PARENT_READY } as any,
          CHILD_READY as any,
          signal
        );
      } else {
        await this.wait(PARENT_READY as any, signal);
        this.send({
          type: CHILD_READY,
        } as any);
      }
      this.readyResRej.resolver();
    } catch (err) {
      this.readyResRej.rejector(err);
    }
  }

  /**
   * Send a message to the peer
   * @param message
   */
  send<OM extends OutboundMessage>(message: OM) {
    // TODO: fix '*' here
    this.peer.postMessage(JSON.stringify(message), '*');
    console.info(`${this.role}: Message sent |> ${messageToString(message)}`);
  }

  subscribe<IM extends InferMessageType<InboundMessage>>(
    messageTypeOrTypes: IM | IM[],
    handler: (
      err: any,
      message?: InferMessageFromType<IM, InboundMessage>
    ) => void
  ) {
    const h = (e: MessageEvent) => {
      if (e.source === this.peer) {
        try {
          const message =
            typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          const mts = Array.isArray(messageTypeOrTypes)
            ? messageTypeOrTypes
            : [messageTypeOrTypes];
          if (mts.includes(message?.type)) {
            handler(null, message);
            console.info(
              `${this.role}: Message recv <| ${messageToString(message)}]`
            );
          }
        } catch (err) {
          handler(err);
          console.error(`${this.role}: Message recv failed`, err);
        }
      }
    };
    window.addEventListener('message', h);

    // Returns unsubscription
    return () => {
      window.removeEventListener('message', h);
    };
  }

  /**
   * Wait for a message
   */
  wait<IM extends InferMessageType<InboundMessage>>(
    messageTypeOrTypes: IM | IM[],
    signal?: AbortSignal
  ) {
    return new Promise<InferMessageFromType<IM, InboundMessage> | undefined>(
      (res, rej) => {
        let unsub: (() => void) | null = null;
        const doUnsub = () => {
          unsub?.();
          unsub = null;
        };
        const handleAbort = () => {
          doUnsub();
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
          } else if (p) {
            res(p);
          }
          doUnsub();
        });
      }
    );
  }

  ask<OM extends OutboundMessage, IMT extends InferMessageType<InboundMessage>>(
    message: OM,
    inboundMessageTypes: IMT | IMT[],
    signal?: AbortSignal
  ) {
    this.send(message);
    return this.wait(inboundMessageTypes, signal);
  }
}
