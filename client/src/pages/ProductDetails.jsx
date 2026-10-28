
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { getProducts } from "../services/productService";
import { useCart } from "../context/CartContext";
import { ProductGrid } from "../components/products";

export default function ProductDetails() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState(false);

useEffect(() => {
  let active = true;

  getProducts()
    .then((data) => {
      if (active) setProducts(data);
    })
    .catch(() => {
      if (active) setLoadError(true);
    })
    .finally(() => {
      if (active) setLoading(false);
    });

  return () => {
    active = false;
  };
}, []);

const product = products.find(
  (item) => String(item.id) === String(id)
);

  const images = useMemo(() => {
    if (!product) return [];

    const productImages = product.images?.length
      ? product.images
      : [product.image].filter(Boolean);

    return productImages;
  }, [product]);

  const sizes = product?.sizes ?? [];
  const colors = product?.colors ?? [];

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");

  // Reset product-specific selections when navigating to another product.
  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);
    setFeedback("");
  }, [id]);

  const stock = Math.max(
    0,
    Number(product?.stock ?? 99) || 0
  );

  const colorValue = (color) => {
    if (typeof color === "string") return color;

    return (
      color?.name ??
      color?.label ??
      color?.value ??
      color?.hex ??
      ""
    );
  };

  const colorSwatch = (color) => {
    if (typeof color === "string") return color;

    return color?.hex ?? color?.value ?? "#D4C4B0";
  };

  const handleAddToBag = () => {
    if (!product) return;

    if (sizes.length > 0 && !selectedSize) {
      setFeedback("Please select a size first.");
      return;
    }

    if (colors.length > 0 && !selectedColor) {
      setFeedback("Please select a color first.");
      return;
    }

    const result = addItem(product, {
      size: selectedSize,
      color: selectedColor,
      quantity,
    });

    if (result.ok) {
      setFeedback("Added to bag!");
    } else if (result.reason === "out-of-stock") {
      setFeedback("This product is currently out of stock.");
    } else if (result.reason === "stock-limit") {
      setFeedback("You've reached the available stock limit.");
    } else {
      setFeedback("Unable to add this product. Please try again.");
    }
  };
if (loading) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <p className="text-muted-foreground">Loading product...</p>
    </main>
  );
}
  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-20">
        <h1 className="text-2xl font-semibold">
  {loadError ? "Unable to load product" : "Product not found"}
</h1>

<p className="mt-3 text-muted-foreground">
  {loadError
    ? "Please check that the backend server is running and try again."
    : "This product may have been removed or the link may be incorrect."}
</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 underline underline-offset-4"
        >
          <ArrowLeft size={16} />
          Back to shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-12">
      <Link
        to="/shop"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Product images */}
        <section aria-label="Product images">
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-secondary">
            {images.length > 0 ? (
              <img
                src={images[selectedImage] ?? images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Image unavailable
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedImage(index);
                    setFeedback("");
                  }}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={selectedImage === index}
                  className={`size-20 shrink-0 overflow-hidden rounded-md border-2 ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Product information */}
        <section className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {product.category ?? "TRIZIP Collection"}
          </p>

          <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
            {product.name}
          </h1>

          <p className="mt-5 text-xl font-medium">
            ${Number(product.price).toFixed(2)}
          </p>

          {product.description && (
            <p className="mt-6 leading-7 text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Size selection */}
          {sizes.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium">Size</label>
                <span className="text-xs text-muted-foreground">
                  Select your size
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setFeedback("");
                    }}
                    aria-pressed={selectedSize === size}
                    className={`min-w-12 rounded-md border px-4 py-3 text-sm transition-colors ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selection */}
          {colors.length > 0 && (
            <div className="mt-7">
              <p className="mb-3 text-sm font-medium">
                Color
                {selectedColor && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    {selectedColor}
                  </span>
                )}
              </p>

              <div className="flex flex-wrap gap-3">
                {colors.map((color, index) => {
                  const value = colorValue(color);
                  const swatch = colorSwatch(color);

                  return (
                    <button
                      key={`${value}-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedColor(value);
                        setFeedback("");
                      }}
                      aria-label={`Select ${value || `color ${index + 1}`}`}
                      aria-pressed={selectedColor === value}
                      className={`size-9 rounded-full border-2 p-0.5 ${
                        selectedColor === value
                          ? "border-primary"
                          : "border-border"
                      }`}
                    >
                      <span
                        className="block h-full w-full rounded-full border border-black/10"
                        style={{ backgroundColor: swatch }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-7">
            <label className="mb-3 block text-sm font-medium">
              Quantity
            </label>

            <div className="inline-flex items-center rounded-md border border-border">
              <button
                type="button"
                onClick={() => {
                  setQuantity((current) => Math.max(1, current - 1));
                  setFeedback("");
                }}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="p-3 disabled:opacity-40"
              >
                <Minus size={16} />
              </button>

              <span
                className="min-w-10 text-center text-sm"
                aria-live="polite"
              >
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => {
                  setQuantity((current) =>
                    Math.min(stock, current + 1)
                  );
                  setFeedback("");
                }}
                disabled={quantity >= stock}
                aria-label="Increase quantity"
                className="p-3 disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Add to bag */}
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={stock < 1}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-md bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag size={18} />
            {stock < 1 ? "Out of Stock" : "Add to Bag"}
          </button>

          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-3 text-sm ${
                feedback === "Added to bag!"
                  ? "text-green-700"
                  : "text-muted-foreground"
              }`}
            >
              {feedback}
            </p>
          )}

          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Your selection will be saved in your shopping bag as you browse.
          </p>
        </section>
      </div>
      
        {/* You May Also Like */}
        <section className="mt-20 border-t border-border pt-12 md:mt-28 md:pt-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Complete Your Look
              </p>
              <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                You May Also Like
              </h2>
            </div>

            <Link
              to="/shop"
              className="shrink-0 text-sm underline underline-offset-4 transition-opacity hover:opacity-60"
            >
              View All
            </Link>
          </div>

         <ProductGrid
  products={products
    .filter((item) => String(item.id) !== String(product.id))
    .slice(0, 4)}
  columns={4}
  gap={6}
/>
          
        </section>

    </main>
  );
}
