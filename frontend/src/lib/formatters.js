// Indian currency formatter
export const formatIndianCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Format in Indian standard (lakhs/crores)
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numAmount);
};

// Indian number formatter (without currency symbol)
export const formatIndianNumber = (num) => {
    if (!num && num !== 0) return '0';

    return new Intl.NumberFormat('en-IN').format(num);
};

// Convert to lakhs
export const toLakhs = (amount) => {
    return (amount / 100000).toFixed(2);
};

// Convert to crores
export const toCrores = (amount) => {
    return (amount / 10000000).toFixed(2);
};
