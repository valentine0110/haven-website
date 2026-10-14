/**
 * Cloudinary & image optimization helper.
 * Injects automatic format (WebP/AVIF), auto compression, and exact width scaling.
 */
export function optimizeImage(url, options = {}) {
  if (!url || typeof url !== "string") return "/placeholder-property.svg";

  const { width = 800, quality = "auto", crop = "limit" } = options;

  // Cloudinary image URL transformation
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    // Avoid double transformation
    if (url.includes("/image/upload/f_auto")) return url;

    const transformParams = `f_auto,q_${quality},w_${width},c_${crop}`;
    return url.replace("/image/upload/", `/image/upload/${transformParams}/`);
  }

  // Supabase storage image transformation (if Supabase Image Transformation is enabled)
  if (url.includes(".supabase.co/storage/v1/object/public/")) {
    // Return standard url or render with params if supported
    return url;
  }

  return url;
}

/**
 * Generates srcset for responsive images.
 */
export function generateSrcSet(url) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) return undefined;

  const sizes = [400, 800, 1200];
  return sizes
    .map((w) => `${optimizeImage(url, { width: w })} ${w}w`)
    .join(", ");
}

