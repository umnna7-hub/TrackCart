
import jacket01 from "../assets/images/jacket-01.jfif";
import jacket02 from "../assets/images/jacket-02.jfif";
import jacket03 from "../assets/images/jacket-03.jfif";
import jacket04 from "../assets/images/jacket-04.jfif";
import jacket05 from "../assets/images/jacket-05.jfif";
import jacket06 from "../assets/images/jacket-06.jfif";
import jacket07 from "../assets/images/jacket-07.jfif";
import jacket08 from "../assets/images/jacket-08.jfif";
import jacket09 from "../assets/images/jacket-09.jfif";
import jacket10 from "../assets/images/jacket-10.jfif";
import jacket11 from "../assets/images/jacket-11.jfif";

const API_URL = "http://127.0.0.1:5000/api";
const productImages = {
  "Classic Leather Jacket": {
    image: jacket01,
    images: [jacket01, jacket02, jacket03],
    colors: ["#171717", "#5B4030"],
  },
  "Classic Leather Jacket — Vintage Cut": {
    image: jacket04,
    images: [jacket04, jacket05, jacket06],
    colors: ["#171717", "#5B4030"],
  },
  "Technical Bomber": {
    image: jacket07,
    images: [jacket07, jacket08, jacket09],
    colors: ["#6D7050", "#292929"],
  },
  "Vintage Denim Jacket": {
    image: jacket10,
    images: [jacket10, jacket11, jacket01],
    colors: ["#343D4A"],
  },
  "Wool Overcoat": {
    image: jacket02,
    images: [jacket02, jacket03, jacket04],
    colors: ["#A07850", "#252525"],
  },
};
async function fetchProducts() {
  const response = await fetch(`${API_URL}/products`);

  if (!response.ok) {
    throw new Error("Failed to fetch products from the server.");
  }

  const data = await response.json();

 return data.products.map((product) => ({
  ...product,
  ...(productImages[product.name] || {}),
  sizes: ["S", "M", "L", "XL"],
  isNew: [
    "Classic Leather Jacket",
    "Classic Leather Jacket — Vintage Cut",
    "Technical Bomber",
  ].includes(product.name),
}));
}

export async function getProducts() {
  return fetchProducts();
}

export async function getProductById(id) {
  const products = await fetchProducts();

  return products.find(
    (product) => String(product.id) === String(id)
  ) ?? null;
}

export async function getNewArrivals() {
  const products = await fetchProducts();
  return products.filter((product) => product.isNew);
}

export async function getProductsByCategory(category) {
  const products = await fetchProducts();

  return products.filter(
    (product) =>
      product.category?.toLowerCase() === category.toLowerCase()
  );
}
