import moment from "moment";

export type LifetimeFormat = "short" | "long";

export const getRemainingLifetime = (
    createdAt: string,
    timeoutMs: number,
    format: LifetimeFormat = "short"
): string | null => {
    if (!timeoutMs || timeoutMs <= 0) return null;

    const expiresAt = moment(createdAt).add(timeoutMs, "milliseconds");
    const remaining = moment.duration(expiresAt.diff(moment()));

    if (remaining.asMilliseconds() <= 0) {
        return format === "short" ? "Expiring..." : "Expiring soon";
    }

    const days = Math.floor(remaining.asDays());
    const hours = remaining.hours();
    const minutes = remaining.minutes();
    const seconds = remaining.seconds();

    const parts: string[] = [];

    if (format === "short") {
        // Compact: "6d 23h 45m 12s left"
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0 || days > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
        return `${parts.join(" ")} left`;
    }

    // Long: "6 days, 23 hours, 45 minutes, 12 seconds"
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0 || days > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
    return parts.join(", ");
};

export const getLifetimeColor = (
    createdAt: string,
    timeoutMs: number,
    safeColor: string = "text-gray-200"
): string => {
    if (!timeoutMs || timeoutMs <= 0) return "text-gray-400";

    const expiresAt = moment(createdAt).add(timeoutMs, "milliseconds");
    const remainingMs = expiresAt.diff(moment());

    if (remainingMs <= 0) return "text-red-500";
    if (remainingMs < 24 * 60 * 60 * 1000) return "text-red-400";
    if (remainingMs < 3 * 24 * 60 * 60 * 1000) return "text-yellow-400";
    return safeColor;
};