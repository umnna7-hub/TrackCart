
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ProductGrid } from "../components/products";
import { getProducts } from "../services/productService";

const categories = [
  "All",
  "Leather",
  "Outerwear",
  "Vintage",
  "Denim",
];

export default function Shop() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(false);

        const data = await getProducts();

        if (!cancelled) {
          setAllProducts(data);
        }
      } catch (err) {
        console.error("Failed to load products:", err);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const products = useMemo(() => {
    let result = allProducts.filter((product) => {
     
const matchesCategory =
  category === "All" ||
  (category === "Vintage"
    ? product.name.toLowerCase().includes("vintage")
    : product.category === category);


      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });

    if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sort === "newest") {
      result.sort(
        (a, b) => Number(b.isNew) - Number(a.isNew)
      );
    }

    return result;
  }, [allProducts, category, sort, search]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <Link to="/">Home</Link> / Shop
        </div>

        <div className="flex flex-col justify-between gap-5 border-b border-border pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-primary">
              The TRIZIP Collection
            </p>

            <h1 className="text-4xl font-medium uppercase tracking-tight sm:text-5xl">
              Shop All
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Considered outerwear. Timeless silhouettes.
              Made for the modern wardrobe.
            </p>
          </div>

          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {loading ? "Loading products..." : `${products.length} Products`}
          </p>
        </div>

        <div className="flex flex-col gap-5 py-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`border-b pb-2 text-xs uppercase tracking-widest transition-colors ${
                  category === item
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
            />

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort products"
              className="border border-border bg-background px-4 py-3 text-xs uppercase tracking-wider"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <p className="text-sm text-muted-foreground">
              Loading products...
            </p>
          </div>
        ) : error ? (
          <div className="py-24 text-center">
            <h2 className="text-xl uppercase">
              Unable to load products
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 border-b border-primary pb-1 text-xs uppercase tracking-widest"
            >
              Try Again
            </button>
          </div>
        ) : products.length > 0 ? (
          <ProductGrid
            products={products}
            columns={4}
            gap="gap-x-5 gap-y-10"
          />
        ) : (
          <div className="py-24 text-center">
            <h2 className="text-xl uppercase">
              No products found
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Try another search or category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="mt-6 border-b border-primary pb-1 text-xs uppercase tracking-widest"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
