export type TMessage<
  Type extends string = string,
  Payload = undefined
> = Payload extends undefined
  ? {
      type: Type;
    }
  : {
      type: Type;
      payload: Payload;
    };

export type InferMessageFromType<
  Type extends string,
  M extends TMessage
> = M extends TMessage<infer AllTypes, infer Payload>
  ? AllTypes extends Type
    ? TMessage<AllTypes, Payload>
    : never
  : M extends TMessage<infer AllTypes>
  ? AllTypes extends Type
    ? TMessage<AllTypes>
    : never
  : never;
