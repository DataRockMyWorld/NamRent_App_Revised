import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { apiClient } from "@/services/apiClient";
import type { Vehicle } from "@/types";
import { labelify } from "@/utils/format";
import {
  Input, Select, Textarea, PageLoader, SectionCard, DetailRow, MultiStepForm,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  // Step 1 — Vehicle Details
  registration_number: z.string().min(1, "Required"),
  vin: z.string().optional(),
  make: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  year: z.number().int().min(1950, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  colour: z.string().min(1, "Required"),
  vehicle_type: z.enum(["SEDAN", "SUV", "PICKUP", "VAN", "BUS", "TRUCK", "OTHER"]),
  fuel_type: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  mileage: z.number().int().min(0).optional(),
  ownership_type: z.enum(["CLIENT_OWNED", "NAMRENT_OWNED", "DEALER_SUPPLIED", "LEASE", "TRADE_IN"]),
  current_status: z.enum(["ACTIVE", "PENDING_ONBOARDING", "UNDER_MAINTENANCE", "OUT_OF_SERVICE", "PENDING_TRADE_IN", "RETURNED", "ARCHIVED"]),
  // Step 2 — Insurance & Tracking
  insurance_provider: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_start: z.string().optional(),
  insurance_expiry: z.string().optional(),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  tracking_provider: z.string().optional(),
  tracking_device_id: z.string().optional(),
  tracking_status: z.enum(["ACTIVE", "INACTIVE", "NOT_INSTALLED"]),
  tracking_renewal_date: z.string().optional(),
  notes: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof schema>;

// Fields validated at each step
const STEP_FIELDS: (keyof VehicleFormValues)[][] = [
  ["registration_number", "make", "model", "year", "colour", "vehicle_type", "fuel_type", "transmission", "ownership_type", "current_status"],
  [], // Step 2 — all optional
  [], // Step 3 — review, no validation
];

const STEPS = [
  { title: "Vehicle Details", description: "Core information about the vehicle." },
  { title: "Insurance & Tracking", description: "Policy, licensing and GPS tracking details. All fields are optional." },
  { title: "Review & Submit", description: "Review your entries before saving." },
];

// ── Option lists ───────────────────────────────────────────────────────────────
const VEHICLE_TYPE_OPTIONS = [
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "PICKUP", label: "Pickup" },
  { value: "VAN", label: "Van" },
  { value: "BUS", label: "Bus" },
  { value: "TRUCK", label: "Truck" },
  { value: "OTHER", label: "Other" },
];
const FUEL_OPTIONS = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Electric" },
  { value: "HYBRID", label: "Hybrid" },
];
const TRANSMISSION_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "AUTOMATIC", label: "Automatic" },
];
const OWNERSHIP_OPTIONS = [
  { value: "NAMRENT_OWNED", label: "NamRent Owned" },
  { value: "CLIENT_OWNED", label: "Client Owned" },
  { value: "DEALER_SUPPLIED", label: "Dealer Supplied" },
  { value: "LEASE", label: "Lease" },
  { value: "TRADE_IN", label: "Trade-in" },
];
const STATUS_OPTIONS = [
  { value: "PENDING_ONBOARDING", label: "Pending Onboarding" },
  { value: "ACTIVE", label: "Active" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "OUT_OF_SERVICE", label: "Out of Service" },
  { value: "PENDING_TRADE_IN", label: "Pending Trade-in" },
  { value: "RETURNED", label: "Returned" },
  { value: "ARCHIVED", label: "Archived" },
];
const TRACKING_STATUS_OPTIONS = [
  { value: "NOT_INSTALLED", label: "Not installed" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function VehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    getValues,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_type: "SEDAN",
      fuel_type: "PETROL",
      transmission: "AUTOMATIC",
      ownership_type: "NAMRENT_OWNED",
      current_status: "PENDING_ONBOARDING",
      tracking_status: "NOT_INSTALLED",
    },
  });

  // Fetch existing vehicle for edit mode
  const { data: vehicle, isLoading: loadingVehicle } = useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => apiClient.get<Vehicle>(`/vehicles/${id}/`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        registration_number: vehicle.registration_number,
        vin: vehicle.vin ?? "",
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        colour: vehicle.colour,
        vehicle_type: vehicle.vehicle_type,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        mileage: vehicle.mileage ?? undefined,
        ownership_type: vehicle.ownership_type,
        current_status: vehicle.current_status,
        insurance_provider: vehicle.insurance_provider ?? "",
        insurance_policy_number: vehicle.insurance_policy_number ?? "",
        insurance_start: vehicle.insurance_start ?? "",
        insurance_expiry: vehicle.insurance_expiry ?? "",
        license_number: vehicle.license_number ?? "",
        license_expiry: vehicle.license_expiry ?? "",
        tracking_provider: vehicle.tracking_provider ?? "",
        tracking_device_id: vehicle.tracking_device_id ?? "",
        tracking_status: vehicle.tracking_status ?? "NOT_INSTALLED",
        tracking_renewal_date: vehicle.tracking_renewal_date ?? "",
        notes: vehicle.notes ?? "",
      });
    }
  }, [vehicle, reset]);

  const mutation = useMutation({
    mutationFn: (data: VehicleFormValues) =>
      isEdit
        ? apiClient.patch(`/vehicles/${id}/`, data)
        : apiClient.post("/vehicles/", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      const vehicleId = isEdit ? id : res.data?.id;
      navigate(vehicleId ? `/vehicles/${vehicleId}` : "/vehicles");
    },
    onError: () => setApiError("Failed to save vehicle. Please check your entries and try again."),
  });

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 ? true : await trigger(fields);
    if (valid) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleFormSubmit = handleSubmit((data) => {
    setApiError(null);
    // Strip empty strings from optional date/string fields
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
    );
    mutation.mutate(cleaned as VehicleFormValues);
  });

  if (isEdit && loadingVehicle) return <PageLoader />;

  const values = getValues();

  return (
    <div className="page-container">
      <PageHeader
        title={isEdit ? "Edit Vehicle" : "Add Vehicle"}
        subtitle={isEdit ? `Editing ${vehicle?.registration_number ?? ""}` : "Register a new vehicle in the fleet"}
      />

      <div className="max-w-2xl">
        <MultiStepForm
          steps={STEPS}
          currentStep={step}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleFormSubmit}
          isSubmitting={mutation.isPending}
          submitLabel={isEdit ? "Save changes" : "Add vehicle"}
        >
          {/* ── Step 1: Vehicle Details ────────────────────────────────────── */}
          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Registration number"
                placeholder="e.g. N 12345 WB"
                error={errors.registration_number?.message}
                {...register("registration_number")}
              />
              <Input
                label="VIN / Chassis number"
                placeholder="Optional"
                {...register("vin")}
              />
              <Input
                label="Make"
                placeholder="e.g. Toyota"
                error={errors.make?.message}
                {...register("make")}
              />
              <Input
                label="Model"
                placeholder="e.g. Hilux"
                error={errors.model?.message}
                {...register("model")}
              />
              <Input
                label="Year"
                type="number"
                placeholder={String(new Date().getFullYear())}
                error={errors.year?.message}
                {...register("year", { valueAsNumber: true })}
              />
              <Input
                label="Colour"
                placeholder="e.g. White"
                error={errors.colour?.message}
                {...register("colour")}
              />
              <Select
                label="Vehicle type"
                options={VEHICLE_TYPE_OPTIONS}
                error={errors.vehicle_type?.message}
                {...register("vehicle_type")}
              />
              <Select
                label="Fuel type"
                options={FUEL_OPTIONS}
                error={errors.fuel_type?.message}
                {...register("fuel_type")}
              />
              <Select
                label="Transmission"
                options={TRANSMISSION_OPTIONS}
                error={errors.transmission?.message}
                {...register("transmission")}
              />
              <Input
                label="Mileage (km)"
                type="number"
                placeholder="Optional"
                {...register("mileage", { valueAsNumber: true })}
              />
              <Select
                label="Ownership type"
                options={OWNERSHIP_OPTIONS}
                error={errors.ownership_type?.message}
                {...register("ownership_type")}
              />
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                error={errors.current_status?.message}
                {...register("current_status")}
              />
            </div>
          )}

          {/* ── Step 2: Insurance & Tracking ──────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <SectionCard title="Insurance">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Provider" placeholder="e.g. Old Mutual" {...register("insurance_provider")} />
                  <Input label="Policy number" placeholder="Optional" {...register("insurance_policy_number")} />
                  <Input label="Start date" type="date" {...register("insurance_start")} />
                  <Input label="Expiry date" type="date" {...register("insurance_expiry")} />
                </div>
              </SectionCard>

              <SectionCard title="Licensing">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="License number" placeholder="Optional" {...register("license_number")} />
                  <Input label="License expiry" type="date" {...register("license_expiry")} />
                </div>
              </SectionCard>

              <SectionCard title="Tracking">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Tracking provider" placeholder="e.g. MiX Telematics" {...register("tracking_provider")} />
                  <Input label="Device ID" placeholder="Optional" {...register("tracking_device_id")} />
                  <Select
                    label="Tracking status"
                    options={TRACKING_STATUS_OPTIONS}
                    {...register("tracking_status")}
                  />
                  <Input label="Renewal date" type="date" {...register("tracking_renewal_date")} />
                </div>
              </SectionCard>

              <SectionCard title="Notes">
                <Textarea label="" placeholder="Any additional notes about this vehicle…" rows={3} {...register("notes")} />
              </SectionCard>
            </div>
          )}

          {/* ── Step 3: Review ────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {apiError && (
                <div className="rounded-lg bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                  {apiError}
                </div>
              )}
              <SectionCard title="Vehicle Details">
                <DetailRow label="Registration" value={values.registration_number} />
                <DetailRow label="VIN / Chassis" value={values.vin || undefined} />
                <DetailRow label="Make" value={values.make} />
                <DetailRow label="Model" value={values.model} />
                <DetailRow label="Year" value={values.year} />
                <DetailRow label="Colour" value={values.colour} />
                <DetailRow label="Type" value={labelify(values.vehicle_type ?? "")} />
                <DetailRow label="Fuel" value={labelify(values.fuel_type ?? "")} />
                <DetailRow label="Transmission" value={labelify(values.transmission ?? "")} />
                <DetailRow label="Mileage" value={values.mileage ? `${Number(values.mileage).toLocaleString()} km` : undefined} />
                <DetailRow label="Ownership" value={labelify(values.ownership_type ?? "")} />
                <DetailRow label="Status" value={labelify(values.current_status ?? "")} />
              </SectionCard>

              <SectionCard title="Insurance">
                <DetailRow label="Provider" value={values.insurance_provider || undefined} />
                <DetailRow label="Policy number" value={values.insurance_policy_number || undefined} />
                <DetailRow label="Start date" value={values.insurance_start ? format(new Date(values.insurance_start), "d MMM yyyy") : undefined} />
                <DetailRow label="Expiry date" value={values.insurance_expiry ? format(new Date(values.insurance_expiry), "d MMM yyyy") : undefined} />
              </SectionCard>

              <SectionCard title="Licensing & Tracking">
                <DetailRow label="License number" value={values.license_number || undefined} />
                <DetailRow label="License expiry" value={values.license_expiry ? format(new Date(values.license_expiry), "d MMM yyyy") : undefined} />
                <DetailRow label="Tracking provider" value={values.tracking_provider || undefined} />
                <DetailRow label="Device ID" value={values.tracking_device_id || undefined} />
                <DetailRow label="Tracking status" value={labelify(values.tracking_status ?? "")} />
                <DetailRow label="Renewal date" value={values.tracking_renewal_date ? format(new Date(values.tracking_renewal_date), "d MMM yyyy") : undefined} />
              </SectionCard>

              {values.notes && (
                <SectionCard title="Notes">
                  <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{values.notes}</p>
                </SectionCard>
              )}
            </div>
          )}
        </MultiStepForm>
      </div>
    </div>
  );
}
