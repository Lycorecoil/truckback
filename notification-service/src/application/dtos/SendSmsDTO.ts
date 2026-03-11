export interface SendSmsDTO {
  recipientId: string;
  to: string;
  message: string;
}

export interface SendSmsResponseDTO {
  id: string;
  recipientId: string;
  channel: 'SMS';
  status: 'SENT' | 'FAILED';
}
