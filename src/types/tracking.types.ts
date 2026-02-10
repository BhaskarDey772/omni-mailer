import type { EmailProvider } from './core.types';

export type TrackingEventType =
  | 'delivered'
  | 'bounced'
  | 'failed'
  | 'opened'
  | 'clicked'
  | 'complained'
  | 'unsubscribed';

export interface TrackingEvent {
  type: TrackingEventType;
  messageId: string;
  provider: EmailProvider;
  timestamp: Date;
  recipient: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryEvent extends TrackingEvent {
  type: 'delivered';
  smtpResponse?: string;
}

export interface BounceEvent extends TrackingEvent {
  type: 'bounced';
  bounceType: 'hard' | 'soft' | 'undetermined';
  bounceReason?: string;
  diagnosticCode?: string;
}

export interface OpenEvent extends TrackingEvent {
  type: 'opened';
  userAgent?: string;
  ipAddress?: string;
}

export interface ClickEvent extends TrackingEvent {
  type: 'clicked';
  url: string;
  userAgent?: string;
  ipAddress?: string;
}

export type TrackingEventData =
  | DeliveryEvent
  | BounceEvent
  | OpenEvent
  | ClickEvent
  | TrackingEvent;

export interface TrackingCallbacks {
  onDelivery?: (event: DeliveryEvent) => void | Promise<void>;
  onBounce?: (event: BounceEvent) => void | Promise<void>;
  onOpen?: (event: OpenEvent) => void | Promise<void>;
  onClick?: (event: ClickEvent) => void | Promise<void>;
  onComplaint?: (event: TrackingEvent) => void | Promise<void>;
  onUnsubscribe?: (event: TrackingEvent) => void | Promise<void>;
  onAny?: (event: TrackingEventData) => void | Promise<void>;
}

export interface TrackingConfig {
  baseUrl: string;
  enabled?: boolean;
  trackOpens?: boolean;
  trackClicks?: boolean;
}
