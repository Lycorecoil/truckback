export interface ServiceUrls {
  auth: string;
  company: string;
  fleet: string;
  shipment: string;
  notification: string;
  tracking: string;
}

export function getServiceUrls(): ServiceUrls {
  const required = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env var: ${key}`);
    return value;
  };

  return {
    auth: required('AUTH_SERVICE_URL'),
    company: required('COMPANY_SERVICE_URL'),
    fleet: required('FLEET_SERVICE_URL'),
    shipment: required('SHIPMENT_SERVICE_URL'),
    notification: required('NOTIFICATION_SERVICE_URL'),
    tracking: required('TRACKING_SERVICE_URL'),
  };
}
