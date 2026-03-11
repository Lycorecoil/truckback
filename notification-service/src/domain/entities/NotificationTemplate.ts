import { randomUUID } from 'crypto';
import { NotificationChannel } from './Notification';

export interface NotificationTemplateProps {
  id?: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
}

export class NotificationTemplate {
  private readonly props: Required<Omit<NotificationTemplateProps, 'subject'>> & { subject: string | undefined };

  constructor(props: NotificationTemplateProps) {
    if (!props.name) throw new Error('Le nom du template est obligatoire.');
    if (!props.body) throw new Error('Le corps du template est obligatoire.');

    this.props = {
      id: props.id ?? randomUUID(),
      name: props.name,
      channel: props.channel,
      subject: props.subject,
      body: props.body,
    };
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get channel(): NotificationChannel { return this.props.channel; }
  get subject(): string | undefined { return this.props.subject; }
  get body(): string { return this.props.body; }

  toJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      channel: this.props.channel,
      subject: this.props.subject,
      body: this.props.body,
    };
  }
}
