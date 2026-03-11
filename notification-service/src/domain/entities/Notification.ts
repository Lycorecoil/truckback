import { randomUUID } from 'crypto';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface NotificationProps {
  id?: string;
  recipientId: string;
  channel: NotificationChannel;
  message: string;
  status: NotificationStatus;
  createdAt?: Date;
}

export class Notification {
  private readonly props: Required<NotificationProps>;

  constructor(props: NotificationProps) {
    if (!props.recipientId) throw new Error('recipientId est obligatoire.');
    if (!props.message) throw new Error('Le message est obligatoire.');

    this.props = {
      id: props.id ?? randomUUID(),
      recipientId: props.recipientId,
      channel: props.channel,
      message: props.message,
      status: props.status,
      createdAt: props.createdAt ?? new Date(),
    };
  }

  get id(): string { return this.props.id; }
  get recipientId(): string { return this.props.recipientId; }
  get channel(): NotificationChannel { return this.props.channel; }
  get message(): string { return this.props.message; }
  get status(): NotificationStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }

  toJSON() {
    return {
      id: this.props.id,
      recipientId: this.props.recipientId,
      channel: this.props.channel,
      message: this.props.message,
      status: this.props.status,
      createdAt: this.props.createdAt,
    };
  }
}
