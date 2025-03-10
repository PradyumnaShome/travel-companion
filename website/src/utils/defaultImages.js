export const DEFAULT_IMAGES = {
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb",
  bar: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34",
  museum: "https://images.unsplash.com/photo-1554907984-15263bfd63bd",
  shop: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
  attraction: "https://images.unsplash.com/photo-1562329265-95a6d7a83440",
  default: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
};

export const getDefaultImage = (type) => {
  return DEFAULT_IMAGES[type?.toLowerCase()] || DEFAULT_IMAGES.default;
}; 