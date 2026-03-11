export interface SendEmailDTO {
  recipientId: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResponseDTO {
  id: string;
  recipientId: string;
  channel: 'EMAIL';
  status: 'SENT' | 'FAILED';
}
