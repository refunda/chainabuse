// Single source of truth for the Verification Fee system.
//
// Resolution priority (both for the fee % and the message):
//   1. Per-client override  (profiles.verification_fee_*)        — always wins
//   2. Global setting       (admin_settings.verification_fee_*)  — applies to all clients
//   3. Built-in default     (constants below)                    — pre-existing behavior
//
// NULL/undefined at any level means "fall through to the next level", so the
// frontend behaves exactly as before until the admin actively selects something
// (and works even before FEE_UPGRADE.sql has been run).

export const DEFAULT_VERIFICATION_FEE_PERCENT = 7;

// The exact client-facing text that was previously hardcoded in the withdrawal
// modals (AssetsManager + BuyCryptoView). Kept as the built-in default so there
// is zero visual change until the admin selects a preset or writes a custom text.
export const DEFAULT_VERIFICATION_FEE_MESSAGE =
    "A temporary, fully refundable deposit is required to verify network integrity prior to extraction. Computed against requested volume.";

export const CUSTOM_FEE_PRESET = "custom";

export interface VerificationFeePreset {
    id: string;
    label: string;
    text: string;
}

export const VERIFICATION_FEE_PRESETS: VerificationFeePreset[] = [
    {
        id: "preset_1",
        label: "Network Integrity (current default)",
        text: DEFAULT_VERIFICATION_FEE_MESSAGE,
    },
    {
        id: "preset_2",
        label: "Wallet Control Deposit",
        text: "To protect your funds, our network requires a one-time refundable verification deposit confirming that you control this wallet. The full amount is returned to you as soon as your withdrawal is processed.",
    },
    {
        id: "preset_3",
        label: "Scaled Security Fee",
        text: "For your security, a small fully-refundable verification fee is needed to validate wallet ownership before we release your withdrawal. The amount scales with your withdrawal size and is credited straight back to you.",
    },
    {
        id: "preset_4",
        label: "Anti-Fraud Deposit",
        text: "As a standard anti-fraud measure, please make a temporary refundable deposit to confirm this wallet belongs to you. Rest assured, the full amount is returned together with your withdrawal once it clears.",
    },
];

// Resolves the final message from a stored preset id + custom text.
// Returns null when nothing (valid) is selected, meaning "use the fallback".
export function resolveFeeMessage(preset?: string | null, custom?: string | null): string | null {
    if (preset === CUSTOM_FEE_PRESET) {
        const trimmed = (custom || "").trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    const match = VERIFICATION_FEE_PRESETS.find(p => p.id === preset);
    return match ? match.text : null;
}

// Shape of the columns this module reads off a profiles / admin_settings row.
// All optional: the columns may not exist yet if FEE_UPGRADE.sql hasn't been run.
export interface VerificationFeeSource {
    verification_fee_percent?: number | string | null;
    verification_fee_message?: string | null;
}

// Client-side resolver: takes the raw profile row and the raw admin_settings row
// (either may be null, and the verification_fee_* columns may not exist yet if
// FEE_UPGRADE.sql hasn't been run) and returns the values to display.
// message === null means "render the built-in default text".
export function resolveVerificationFee(
    profile: VerificationFeeSource | null | undefined,
    settings: VerificationFeeSource | null | undefined
): { percent: number; message: string | null } {
    const rawPercent = profile?.verification_fee_percent ?? settings?.verification_fee_percent ?? null;
    const parsed = Number(rawPercent);
    const percent = (rawPercent !== null && rawPercent !== undefined && rawPercent !== "" && !isNaN(parsed))
        ? parsed
        : DEFAULT_VERIFICATION_FEE_PERCENT;

    const clientMsg = typeof profile?.verification_fee_message === "string" ? profile.verification_fee_message.trim() : "";
    const globalMsg = typeof settings?.verification_fee_message === "string" ? settings.verification_fee_message.trim() : "";
    const message = clientMsg || globalMsg || null;

    return { percent, message };
}
