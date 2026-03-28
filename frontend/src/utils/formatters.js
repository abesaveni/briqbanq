export const formatCurrency = (value) => {
    if (value === null || value === undefined) return "$0";
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${Number(value).toLocaleString()}`;
};

export const formatFullCurrency = (value) => {
    if (value === null || value === undefined) return "$0";
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0
    }).format(value);
};

export const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return "Invalid Date";
    }
};
