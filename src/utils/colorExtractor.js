// Extract dominant color from image
export const extractDominantColor = (imageUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Sample a small size for performance
            canvas.width = 50;
            canvas.height = 50;

            ctx.drawImage(img, 0, 0, 50, 50);

            try {
                const imageData = ctx.getImageData(0, 0, 50, 50).data;

                let r = 0, g = 0, b = 0, count = 0;

                // Sample pixels
                for (let i = 0; i < imageData.length; i += 16) {
                    // Skip very dark or very light pixels
                    const pixelR = imageData[i];
                    const pixelG = imageData[i + 1];
                    const pixelB = imageData[i + 2];
                    const brightness = (pixelR + pixelG + pixelB) / 3;

                    if (brightness > 30 && brightness < 220) {
                        r += pixelR;
                        g += pixelG;
                        b += pixelB;
                        count++;
                    }
                }

                if (count > 0) {
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);
                } else {
                    // Fallback to teal
                    r = 20;
                    g = 184;
                    b = 166;
                }

                resolve({ r, g, b });
            } catch (e) {
                // CORS error fallback
                resolve({ r: 20, g: 184, b: 166 });
            }
        };

        img.onerror = () => {
            resolve({ r: 20, g: 184, b: 166 }); // Fallback to teal
        };

        img.src = imageUrl;
    });
};

// Apply dynamic gradient to page
export const applyDynamicGradient = (color) => {
    const meshEl = document.querySelector('.gradient-mesh');
    if (meshEl) {
        meshEl.style.background = `
            radial-gradient(ellipse 80% 50% at 20% -20%, rgba(${color.r}, ${color.g}, ${color.b}, 0.4), transparent),
            radial-gradient(ellipse 60% 40% at 80% -10%, rgba(${color.r}, ${color.g}, ${color.b}, 0.25), transparent)
        `;
    }
};

// Reset to default teal
export const resetGradient = () => {
    applyDynamicGradient({ r: 20, g: 184, b: 166 });
};
