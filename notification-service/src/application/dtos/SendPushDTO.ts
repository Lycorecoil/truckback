export interface SendPushDTO {
  recipientId: string;
  deviceToken: string;
  title: string;
  body: string;
}

export interface SendPushResponseDTO {
  id: string;
  recipientId: string;
  channel: 'PUSH';
  status: 'SENT' | 'FAILED';
}
