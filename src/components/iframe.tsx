import * as React from 'react';
import { Connection, TMessage } from '../core';
import { useEventCallback } from './use-event-callback';

export interface IFrameProps<
  OutboundMessage extends TMessage = TMessage<string, any>,
  InboundMessage extends TMessage = TMessage<string, any>
> extends Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'onLoad'> {
  onConnected: (
    connection: Connection<OutboundMessage, InboundMessage>
  ) => void;
  onConnectionError?: (err: any) => void;
}

export function IFrame({
  onConnected,
  onConnectionError,
  style,
  ...rest
}: IFrameProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [peer, setPeer] = React.useState<Window>();
  const safeOnConnected = useEventCallback(onConnected);
  const safeOnConnectionError = useEventCallback(
    onConnectionError ?? (() => {})
  );

  React.useEffect(() => {
    if (peer) {
      const abortController = new AbortController();
      // If handshake is not dealt within 100, we call init timeout error
      const timer = window.setTimeout(() => abortController.abort(), 100);
      const connection = new Connection('PARENT', peer);
      connection
        .handshake(abortController.signal)
        .then(() => {
          safeOnConnected(connection);
        })
        .catch(safeOnConnectionError)
        .finally(() => clearTimeout(timer));

      return () => abortController.abort();
    }
    return () => {};
  }, [peer, safeOnConnected, safeOnConnectionError]);

  return (
    <iframe
      style={{
        border: 'none',
        background: '#fff',
        ...style,
      }}
      {...rest}
      ref={iframeRef}
      onLoad={() => {
        if (iframeRef.current?.contentWindow) {
          setPeer(iframeRef.current.contentWindow);
        }
      }}
    />
  );
}
