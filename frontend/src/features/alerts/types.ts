export const AlertMetric = {
  SOIL_HUMIDITY: 'SOIL_HUMIDITY',
  SOIL_TEMP: 'SOIL_TEMP',
  AMBIENT_TEMP: 'AMBIENT_TEMP',
  AMBIENT_HUMIDITY: 'AMBIENT_HUMIDITY',
  BATTERY_PERCENTAGE: 'BATTERY_PERCENTAGE'
} as const;
export type AlertMetric = typeof AlertMetric[keyof typeof AlertMetric];

export const AlertOperator = {
  BELOW: 'BELOW',
  ABOVE: 'ABOVE'
} as const;
export type AlertOperator = typeof AlertOperator[keyof typeof AlertOperator];

export interface AlertRule {
  id: string;
  fieldId: string;
  fieldName: string;
  name: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  durationMinutes: number;
  notifyEmail: boolean;
  active: boolean;
  createdAt: string;
}

export interface CreateAlertRuleRequest {
  fieldId: string;
  name: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  durationMinutes: number;
  notifyEmail: boolean;
  active: boolean;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  fieldId: string;
  fieldName: string;
  ruleName: string;
  metric: AlertMetric;
  threshold: number;
  lastValue: number;
  triggeredAt: string;
  notifiedAt: string | null;
  resolvedAt: string | null;
  read: boolean;
  active: boolean;
}
