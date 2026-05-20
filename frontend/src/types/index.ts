// ─── Auth / Users ─────────────────────────────────────────────────────────────
export type UserRole =
  | "SUPER_ADMIN"
  | "NAMRENT_ADMIN"
  | "NAMRENT_OPS"
  | "CLIENT_ADMIN"
  | "CLIENT_USER"
  | "DEALER_ADMIN";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: UserRole;
  avatar: string | null;
  dark_mode: boolean;
  created_at: string;
  client_id?: string | null;
  dealer_id?: string | null;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export type ClientType = "INDIVIDUAL" | "CORPORATE";
export type KYCStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface Client {
  id: string;
  client_type: ClientType;
  company_name: string;
  registration_number: string;
  contact_person_name: string;
  contact_person_title: string;
  email: string;
  phone: string;
  alt_phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  kyc_status: KYCStatus;
  account_status: AccountStatus;
  assigned_account_manager: string | null;
  account_manager_name?: string;
  vehicle_count?: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ─── Dealers ──────────────────────────────────────────────────────────────────
export type DealerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Dealer {
  id: string;
  dealer_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  country: string;
  dealer_status: DealerStatus;
  brands_supplied: string[];
  vat_number: string;
  registration_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export type VehicleType = "SEDAN" | "SUV" | "PICKUP" | "VAN" | "BUS" | "TRUCK" | "OTHER";
export type FuelType = "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
export type Transmission = "MANUAL" | "AUTOMATIC";
export type OwnershipType = "CLIENT_OWNED" | "NAMRENT_OWNED" | "DEALER_SUPPLIED" | "LEASE" | "TRADE_IN";
export type VehicleStatus =
  | "ACTIVE" | "PENDING_ONBOARDING" | "UNDER_MAINTENANCE"
  | "OUT_OF_SERVICE" | "PENDING_TRADE_IN" | "RETURNED" | "ARCHIVED";
export type TrackingStatus = "ACTIVE" | "INACTIVE" | "NOT_INSTALLED";

export interface Vehicle {
  id: string;
  registration_number: string;
  vin: string | null;
  make: string;
  model: string;
  year: number;
  colour: string;
  vehicle_type: VehicleType;
  fuel_type: FuelType;
  transmission: Transmission;
  mileage: number;
  mileage_last_updated: string | null;
  ownership_type: OwnershipType;
  current_status: VehicleStatus;
  assigned_client: string | null;
  client_name?: string;
  assigned_driver: string | null;
  driver_name?: string;
  dealer_source: string | null;
  dealer_name?: string;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_start: string | null;
  insurance_expiry: string | null;
  license_number: string;
  license_expiry: string | null;
  tracking_provider: string;
  tracking_device_id: string;
  tracking_status: TrackingStatus;
  tracking_renewal_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleAssignment {
  id: string;
  vehicle: string;
  vehicle_display: string;
  client: string;
  client_name: string;
  driver: string | null;
  driver_name: string | null;
  start_date: string;
  end_date: string | null;
  notes: string;
  created_at: string;
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export type PathwayType = "EXISTING_FLEET" | "NEW_PROCUREMENT" | "TRADE_IN";
export type ContractStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "TERMINATED" | "RENEWED";
export type PaymentSchedule = "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type RenewalStatus = "NOT_DUE" | "PENDING" | "RENEWED" | "LAPSED";

export interface Contract {
  id: string;
  contract_number: string;
  client: string;
  client_name: string;
  pathway_type: PathwayType;
  start_date: string;
  end_date: string;
  duration_months: number;
  monthly_fee: string;
  services_included: string[];
  payment_schedule: PaymentSchedule;
  status: ContractStatus;
  renewal_status: RenewalStatus;
  vehicle_count?: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ─── Maintenance ──────────────────────────────────────────────────────────────
export type RequestType = "ROUTINE" | "BREAKDOWN" | "REPAIR" | "INSPECTION" | "ACCIDENT";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceStatus =
  | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "ASSIGNED"
  | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED";

export interface MaintenanceRequest {
  id: string;
  reference_number: string;
  vehicle: string;
  vehicle_display: string;
  client: string;
  client_name: string;
  reported_by: string | null;
  reported_by_name: string | null;
  request_type: RequestType;
  priority: Priority;
  description: string;
  location_description: string;
  assigned_officer: string | null;
  assigned_officer_name: string | null;
  service_provider_name: string;
  status: MaintenanceStatus;
  cost_estimate: string | null;
  final_cost: string | null;
  scheduled_date: string | null;
  completion_date: string | null;
  completion_notes: string;
  created_at: string;
  updated_at: string;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "EFT" | "CASH" | "OTHER";

export interface InvoiceItem {
  id: number;
  item_type: string;
  description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client: string;
  client_name: string;
  contract: string | null;
  contract_number: string | null;
  issue_date: string;
  due_date: string;
  period_start: string | null;
  period_end: string | null;
  subtotal: string;
  vat_rate: string;
  vat_amount: string;
  total_amount: string;
  status: InvoiceStatus;
  payment_method: PaymentMethod | null;
  payment_date: string | null;
  payment_reference: string;
  notes: string;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export interface ActivityLog {
  id: string;
  actor_name: string | null;
  verb: string;
  description: string;
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType =
  | "REQUEST_SUBMITTED" | "REQUEST_APPROVED" | "REQUEST_REJECTED"
  | "DEALER_ASSIGNED" | "OFFER_SUBMITTED" | "INVOICE_SENT" | "INVOICE_OVERDUE"
  | "MAINTENANCE_UPDATE" | "INSURANCE_EXPIRY" | "LICENSE_EXPIRY"
  | "CONTRACT_EXPIRY" | "TRACKING_RENEWAL" | "GENERAL";

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ─── Service Requests ─────────────────────────────────────────────────────────
export type ServiceRequestStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "CONTRACTED" | "ACTIVE" | "REJECTED";

export interface ServiceRequest {
  id: string;
  reference_number: string;
  client: string;
  client_name: string;
  selected_services: string[];
  duration_years: number;
  status: ServiceRequestStatus;
  vehicle_count?: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Procurement ──────────────────────────────────────────────────────────────
export type ProcurementStatus =
  | "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "DEALERS_ASSIGNED"
  | "OFFERS_RECEIVED" | "OFFER_SELECTED" | "APPROVED" | "CONTRACTED" | "ACTIVE";
export type OfferStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";

export interface DealerOffer {
  id: string;
  dealer: string;
  dealer_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_colour: string;
  offered_price: string;
  status: OfferStatus;
  submitted_at: string | null;
  created_at: string;
}

export interface ProcurementRequest {
  id: string;
  reference_number: string;
  client: string;
  client_name: string;
  vehicle_type: string;
  quantity: number;
  arrangement_type: "LEASE" | "PURCHASE";
  status: ProcurementStatus;
  offer_count?: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Trade-ins ────────────────────────────────────────────────────────────────
export type VehicleCondition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
export type TradeInStatus =
  | "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "VALUATION_REQUESTED"
  | "VALUATION_SUBMITTED" | "VALUATION_ACCEPTED" | "REPLACEMENT_REQUESTED"
  | "OFFER_RECEIVED" | "APPROVED" | "CONTRACTED" | "ACTIVE";

export interface TradeInRequest {
  id: string;
  reference_number: string;
  client: string;
  client_name: string;
  trade_in_vehicle: string;
  vehicle_display: string;
  trade_in_condition: VehicleCondition;
  status: TradeInStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}
