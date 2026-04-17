import "reflect-metadata";
import { METADATA_KEYS } from "./keys";

export interface EventDefinition {
  methodName: string;
  event: string;
  type: "on" | "once";
}

function createEventDecorator(event: string, type: "on" | "once"): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor;

    // Retrieve existing events or initialize a fresh array
    const existingEvents: EventDefinition[] = Reflect.getMetadata(METADATA_KEYS.EVENTS, constructor) || [];

    existingEvents.push({
      methodName: String(propertyKey),
      event,
      type,
    });

    Reflect.defineMetadata(METADATA_KEYS.EVENTS, existingEvents, constructor);

    return descriptor;
  };
}

/**
 * @On
 * Triggered on every occurrence of the event.
 * Marks a method to be executed whenever the specified client event is emitted.
 *
 * @example
 * ```ts
 * import { Stoat, On } from 'stoatx';
 * import { Message, Client } from 'stoat.js';
 *
 * @Stoat()
 * class BotEvents {
 *   @On('messageCreate')
 *   async onMessage(message: Message, client: Client) {
 *     console.log('New message received:', message.content);
 *   }
 * }
 * ```
 *
 * @param event The name of the client event to listen to
 */
export function On(event: string): MethodDecorator {
  return createEventDecorator(event, "on");
}

/**
 * @Once
 * Triggered only fully once.
 * Marks a method to be executed only the FIRST time the specified client event is emitted.
 *
 * @example
 * ```ts
 * import { Stoat, Once } from 'stoatx';
 * import { Client } from 'stoat.js';
 *
 * @Stoat()
 * class BotEvents {
 *   @Once('ready')
 *   async onReady(client: Client) {
 *     console.log('Bot successfully started and logged in!');
 *   }
 * }
 * ```
 *
 * @param event The name of the client event to listen to
 */
export function Once(event: string): MethodDecorator {
  return createEventDecorator(event, "once");
}

/**
 * Get all event definitions from a @Stoat class
 */
export function getEventsMetadata(target: Function): EventDefinition[] {
  return Reflect.getMetadata(METADATA_KEYS.EVENTS, target) || [];
}
