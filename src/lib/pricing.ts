export type ServicePricingModel = "per_kg" | "per_load";
export type ServiceOptionType = "detergent" | "fabcon" | "addon";
export type ServiceOptionSelectionType = "single" | "multiple";
export type ServiceOptionPriceType = "per_order" | "per_load";

export type PricingOption = {
  id: string;
  name: string;
  description: string | null;
  price_delta: number;
  price_type: ServiceOptionPriceType;
  is_default: boolean;
  sort_order: number | null;
};

export type PricingOptionGroup = {
  id: string;
  name: string;
  option_type: ServiceOptionType;
  selection_type: ServiceOptionSelectionType;
  is_required: boolean;
  sort_order: number | null;
  service_options: PricingOption[];
};

export type PricingService = {
  id: string;
  name: string;
  description?: string | null;
  pricing_model: ServicePricingModel;
  unit_price: number;
  load_capacity_kg?: number | null;
  service_option_groups?: PricingOptionGroup[] | null;
};

export type ResolvedPricingOption = PricingOption & {
  group_id: string;
  group_name: string;
  option_type: ServiceOptionType;
};

const DEFAULT_LOAD_CAPACITY_KG = 8;

function isValidPricingModel(value: unknown): value is ServicePricingModel {
  return value === "per_kg" || value === "per_load";
}

function isValidOptionType(value: unknown): value is ServiceOptionType {
  return value === "detergent" || value === "fabcon" || value === "addon";
}

function isValidSelectionType(value: unknown): value is ServiceOptionSelectionType {
  return value === "single" || value === "multiple";
}

function isValidPriceType(value: unknown): value is ServiceOptionPriceType {
  return value === "per_order" || value === "per_load";
}

export function getServiceLoadCapacityKg(service: Pick<PricingService, "load_capacity_kg">, shopLoadCapacityKg?: number | null): number {
  const serviceCapacity = Number(service.load_capacity_kg);
  if (Number.isFinite(serviceCapacity) && serviceCapacity > 0) {
    return Number(serviceCapacity.toFixed(2));
  }

  const shopCapacity = Number(shopLoadCapacityKg);
  if (Number.isFinite(shopCapacity) && shopCapacity > 0) {
    return Number(shopCapacity.toFixed(2));
  }

  return DEFAULT_LOAD_CAPACITY_KG;
}

export function getEstimatedLoadCount(weightKg: number, loadCapacityKg: number): number {
  const safeWeight = Math.max(0, Number(weightKg) || 0);
  const safeCapacity = Math.max(0.1, Number(loadCapacityKg) || DEFAULT_LOAD_CAPACITY_KG);
  return Math.max(1, Math.ceil(safeWeight / safeCapacity));
}

export function normalizePricingService(service: Partial<PricingService>): PricingService {
  return {
    id: String(service.id ?? ""),
    name: String(service.name ?? "Service"),
    description: typeof service.description === "string" ? service.description : null,
    pricing_model: isValidPricingModel(service.pricing_model) ? service.pricing_model : "per_kg",
    unit_price: Number(service.unit_price ?? 0),
    load_capacity_kg: typeof service.load_capacity_kg === "number" ? service.load_capacity_kg : null,
    service_option_groups: normalizePricingOptionGroups(service.service_option_groups),
  };
}

export function normalizePricingOptionGroups(input: unknown): PricingOptionGroup[] {
  if (!Array.isArray(input)) return [];

  const groups = input
    .map((group) => {
      if (!group || typeof group !== "object") return null;

      const candidate = group as Record<string, unknown>;
      const optionType = isValidOptionType(candidate.option_type) ? candidate.option_type : "addon";
      const selectionType = isValidSelectionType(candidate.selection_type) ? candidate.selection_type : "single";

      return {
        id: String(candidate.id ?? ""),
        name: String(candidate.name ?? "Options"),
        option_type: optionType,
        selection_type: selectionType,
        is_required: Boolean(candidate.is_required),
        sort_order: typeof candidate.sort_order === "number" ? candidate.sort_order : null,
        service_options: normalizePricingOptions(candidate.service_options),
      } satisfies PricingOptionGroup;
    })
    .filter((group): group is PricingOptionGroup => group !== null);

  return groups.sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0) || left.name.localeCompare(right.name));
}

function normalizePricingOptions(input: unknown): PricingOption[] {
  if (!Array.isArray(input)) return [];

  const options = input
    .map((option) => {
      if (!option || typeof option !== "object") return null;

      const candidate = option as Record<string, unknown>;

      return {
        id: String(candidate.id ?? ""),
        name: String(candidate.name ?? "Option"),
        description: typeof candidate.description === "string" ? candidate.description : null,
        price_delta: Number(candidate.price_delta ?? 0),
        price_type: isValidPriceType(candidate.price_type) ? candidate.price_type : "per_order",
        is_default: Boolean(candidate.is_default),
        sort_order: typeof candidate.sort_order === "number" ? candidate.sort_order : null,
      } satisfies PricingOption;
    })
    .filter((option): option is PricingOption => option !== null);

  return options.sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0) || left.name.localeCompare(right.name));
}

export function getDefaultSelectedOptionIds(service: Partial<PricingService>): string[] {
  const normalizedService = normalizePricingService(service);
  const groups = normalizedService.service_option_groups ?? [];

  return groups.flatMap((group) => {
    const options = group.service_options ?? [];
    const defaults = options.filter((option) => option.is_default);

    if (group.selection_type === "single") {
      const selected = defaults[0] ?? (group.is_required ? options[0] : undefined);
      return selected ? [selected.id] : [];
    }

    if (defaults.length > 0) {
      return defaults.map((option) => option.id);
    }

    if (group.is_required && options.length > 0) {
      return [options[0].id];
    }

    return [];
  });
}

export function resolveSelectedServiceOptions(service: Partial<PricingService>, selectedOptionIds: string[] = []): ResolvedPricingOption[] {
  const normalizedService = normalizePricingService(service);
  const groups = normalizedService.service_option_groups ?? [];
  const requestedIds = new Set(selectedOptionIds);
  const resolved: ResolvedPricingOption[] = [];

  for (const group of groups) {
    const options = group.service_options ?? [];
    const requestedOptions = options.filter((option) => requestedIds.has(option.id));

    if (group.selection_type === "single") {
      const selected = requestedOptions[0] ?? options.find((option) => option.is_default) ?? (group.is_required ? options[0] : undefined);

      if (!selected && group.is_required) {
        throw new Error(`A ${group.name.toLowerCase()} option is required`);
      }

      if (selected) {
        resolved.push({
          ...selected,
          group_id: group.id,
          group_name: group.name,
          option_type: group.option_type,
        });
      }

      continue;
    }

    const selectedMultiple = requestedOptions.length > 0 ? requestedOptions : options.filter((option) => option.is_default);

    if (group.is_required && selectedMultiple.length === 0 && options.length > 0) {
      resolved.push({
        ...options[0],
        group_id: group.id,
        group_name: group.name,
        option_type: group.option_type,
      });
      continue;
    }

    for (const option of selectedMultiple) {
      resolved.push({
        ...option,
        group_id: group.id,
        group_name: group.name,
        option_type: group.option_type,
      });
    }
  }

  return resolved;
}

export function calculateServiceEstimate(input: {
  service: Partial<PricingService>;
  weightKg: number;
  selectedOptionIds?: string[];
  shopLoadCapacityKg?: number | null;
}) {
  const service = normalizePricingService(input.service);
  const loadCapacityKg = getServiceLoadCapacityKg(service, input.shopLoadCapacityKg);
  const loadCount = getEstimatedLoadCount(input.weightKg, loadCapacityKg);
  const safeWeightKg = Number(Math.max(0, input.weightKg).toFixed(2));
  const basePrice = service.pricing_model === "per_load"
    ? Number((service.unit_price * loadCount).toFixed(2))
    : Number((service.unit_price * safeWeightKg).toFixed(2));
  const selectedOptions = resolveSelectedServiceOptions(service, input.selectedOptionIds ?? []);
  const optionsTotal = Number(
    selectedOptions
      .reduce((sum, option) => sum + option.price_delta * (option.price_type === "per_load" ? loadCount : 1), 0)
      .toFixed(2),
  );
  const subtotal = Number((basePrice + optionsTotal).toFixed(2));

  return {
    loadCapacityKg,
    loadCount,
    basePrice,
    optionsTotal,
    subtotal,
    selectedOptions,
  };
}

export function formatServiceRateLabel(service: Partial<PricingService>): string {
  const normalizedService = normalizePricingService(service);
  const currency = `₱${Number(normalizedService.unit_price ?? 0).toFixed(2)}`;

  if (normalizedService.pricing_model === "per_load") {
    return `${currency}/load`;
  }

  return `${currency}/kg`;
}

export function formatOptionPriceDelta(option: Pick<PricingOption, "price_delta" | "price_type">): string {
  if (!option.price_delta) {
    return "Included";
  }

  const suffix = option.price_type === "per_load" ? "/load" : "/order";
  return `+₱${Number(option.price_delta).toFixed(2)}${suffix}`;
}