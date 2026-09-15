import { Badge } from './ui'
import type { InventoryStatus, OrderStatus, PaymentStatus, ReservationStatus } from '../types'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  RESERVATION_STATUS_LABEL,
} from '../utils/format'
import { INVENTORY_STATUS_LABEL } from '../services/inventory'

type Tone = 'neutral' | 'gold' | 'green' | 'blue' | 'amber' | 'red' | 'purple'

const ORDER_TONE: Record<OrderStatus, Tone> = {
  pending: 'amber',
  confirmed: 'blue',
  preparing: 'gold',
  ready: 'purple',
  out_for_delivery: 'purple',
  completed: 'green',
  cancelled: 'red',
}

const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  pending: 'amber',
  processing: 'blue',
  paid: 'green',
  failed: 'red',
  cancelled: 'neutral',
  refunded: 'purple',
}

const RESERVATION_TONE: Record<ReservationStatus, Tone> = {
  pending: 'amber',
  confirmed: 'blue',
  seated: 'gold',
  completed: 'green',
  cancelled: 'red',
  no_show: 'neutral',
}

const INVENTORY_TONE: Record<InventoryStatus, Tone> = {
  in_stock: 'green',
  low_stock: 'amber',
  out_of_stock: 'red',
}

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
)

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge tone={PAYMENT_TONE[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>
)

export const ReservationStatusBadge = ({ status }: { status: ReservationStatus }) => (
  <Badge tone={RESERVATION_TONE[status]}>{RESERVATION_STATUS_LABEL[status]}</Badge>
)

export const InventoryStatusBadge = ({ status }: { status: InventoryStatus }) => (
  <Badge tone={INVENTORY_TONE[status]}>{INVENTORY_STATUS_LABEL[status]}</Badge>
)
