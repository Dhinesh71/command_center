/**
 * Utility to resize an image file to a maximum dimension, converting to JPEG/WEBP.
 * Used to keep payload sizes small for serverless environments.
 * 
 * @param {File} file - The file object from input type="file"
 * @param {number} maxWidth - Max width of the image (default 800px)
 * @param {number} quality - Quality 0-1 (default 0.8)
 * @returns {Promise<string>} - The base64 data URL string
 */
export const resizeImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG for better compression than PNG default
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
