import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Product, Category, ProductVariant } from "../types";
import {
  PageHeader,
  Modal,
  ConfirmDialog,
  Field,
  inputCls,
  selectCls,
  EmptyState,
  Spinner,
  Badge,
  Pagination,
  Table,
  Th,
  Td,
  Tr,
  Btn,
} from "../components/ui";
import { Plus, Pencil, Trash2, X, Upload, Package, Star, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * What we actually POST/PUT to the server.
 * price, stock, isFeatured must be their real JS types — NOT strings.
 * The server schema has no .coerce(); it validates req.body from multer
 * which would stringify everything. We avoid that by sending JSON.
 */
interface ProductPayload {
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  categoryId: string;
  gender: string;
  isFeatured: boolean;
  tags: string[];
  images: string[]; // cloudinary URLs only — files uploaded separately first
}

// ─── Image upload helper ──────────────────────────────────────────────────────
/**
 * Upload new image File objects to the server's product image endpoint.
 * Strategy: POST a minimal multipart/form-data with only the new files and
 * the existing images so the server's image-merge logic keeps old ones intact.
 * Returns the full final image URL array (existing + newly uploaded).
 */
async function uploadProductImages(
  productSlug: string,
  existingUrls: string[],
  newFiles: File[],
): Promise<string[]> {
  if (newFiles.length === 0) return existingUrls;

  const fd = new FormData();
  // Send existing URLs back so the server knows to keep them
  existingUrls.forEach((url) => fd.append("images[]", url));
  // Attach actual file buffers under the "images" multer field
  newFiles.forEach((f) => fd.append("images", f));

  const res = await api.put(`/products/${productSlug}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const updated: Product = res.data.data;
  return updated.images;
}

// ─── Image Picker ─────────────────────────────────────────────────────────────
interface ImagePickerProps {
  existingUrls: string[];
  newFiles: File[];
  onExistingRemove: (url: string) => void;
  onFilesAdd: (files: File[]) => void;
  onNewRemove: (idx: number) => void;
  label?: string;
  hint?: string;
}
function ImagePicker({
  existingUrls,
  newFiles,
  onExistingRemove,
  onFilesAdd,
  onNewRemove,
  label = "Images",
  hint,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Field label={label} hint={hint}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-stone-300 rounded-xl text-sm text-stone-500 hover:border-brand-400 hover:text-brand-600 transition-colors w-full justify-center"
      >
        <Upload size={14} /> Select images
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFilesAdd(files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {(existingUrls.length > 0 || newFiles.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {existingUrls.map((url) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt=""
                className="object-cover rounded-xl border border-stone-200"
                style={{ width: 72, height: 72 }}
              />
              <button
                type="button"
                onClick={() => onExistingRemove(url)}
                className="absolute -top-1.5 -right-1.5 bg-white border border-stone-200 rounded-full p-0.5 text-stone-400 hover:text-red-600 shadow-sm"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {newFiles.map((file, idx) => (
            <div key={idx} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="object-cover rounded-xl border border-dashed border-brand-300"
                style={{ width: 72, height: 72 }}
              />
              <button
                type="button"
                onClick={() => onNewRemove(idx)}
                className="absolute -top-1.5 -right-1.5 bg-white border border-stone-200 rounded-full p-0.5 text-stone-400 hover:text-red-600 shadow-sm"
              >
                <X size={10} />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-brand-500 rounded-b-xl text-[8px] text-white text-center py-0.5">
                new
              </div>
            </div>
          ))}
        </div>
      )}
    </Field>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────
/**
 * Internal form state keeps price/stock/discountPrice as strings for the inputs,
 * but onSubmit converts them to real numbers before calling the parent handler.
 * The parent handler receives a fully-typed ProductPayload + new image files
 * separately, so it can upload images first, then POST/PUT JSON.
 */
function ProductForm({
  initial,
  categories,
  onSubmit,
  loading,
  onClose,
}: {
  initial?: Partial<Product>;
  categories: Category[];
  onSubmit: (payload: ProductPayload, newFiles: File[]) => void;
  loading: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    price: initial?.price != null ? String(initial.price) : "",
    discountPrice: initial?.discountPrice != null ? String(initial.discountPrice) : "",
    stock: initial?.stock != null ? String(initial.stock) : "0",
    categoryId: initial?.category
      ? (categories.find((c) => c.slug === initial.category!.slug)?.id ?? "")
      : "",
    gender: (initial?.gender ?? "unisex") as "men" | "women" | "unisex",
    isFeatured: initial?.isFeatured ?? false,
    tags: (initial?.tags ?? []).join(", "),
  });

  const [keptImages, setKeptImages] = useState<string[]>(initial?.images ?? []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const handleNameChange = (v: string) => {
    setForm((f) => ({
      ...f,
      name: v,
      // Only auto-generate slug when creating (initial has no slug yet)
      slug: initial?.slug
        ? f.slug
        : v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);

    if (isNaN(price) || price < 0) {
      toast.error("Price must be a valid number");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error("Stock must be a valid number");
      return;
    }

    const tags = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const payload: ProductPayload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price,
      stock,
      categoryId: form.categoryId,
      gender: form.gender,
      isFeatured: form.isFeatured,
      tags,
      images: keptImages, // existing kept URLs; new uploads handled by parent
    };

    if (form.discountPrice) {
      const dp = parseFloat(form.discountPrice);
      if (!isNaN(dp)) payload.discountPrice = dp;
    }

    onSubmit(payload, newImageFiles);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" required>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="Bifold Leather Wallet"
          />
        </Field>
        <Field label="Slug" required hint="Auto-generated from name">
          <input
            className={`${inputCls} font-mono`}
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
          />
        </Field>
      </div>

      <Field label="Description" required>
        <textarea
          className={inputCls}
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
          placeholder="Describe this product…"
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Price (PKR)" required>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputCls}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
            placeholder="1500"
          />
        </Field>
        <Field label="Discount Price">
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputCls}
            value={form.discountPrice}
            onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
            placeholder="Optional"
          />
        </Field>
        <Field label="Stock" required>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" required>
          <select
            className={selectCls}
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gender">
          <select
            className={selectCls}
            value={form.gender}
            onChange={(e) =>
              setForm((f) => ({ ...f, gender: e.target.value as "men" | "women" | "unisex" }))
            }
          >
            <option value="unisex">Unisex</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </Field>
      </div>

      <Field label="Tags" hint="Comma-separated: leather, wallet, slim">
        <input
          className={inputCls}
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="wallet, leather, bifold"
        />
      </Field>

      <ImagePicker
        existingUrls={keptImages}
        newFiles={newImageFiles}
        onExistingRemove={(url) => setKeptImages((p) => p.filter((u) => u !== url))}
        onFilesAdd={(files) => setNewImageFiles((p) => [...p, ...files])}
        onNewRemove={(idx) => setNewImageFiles((p) => p.filter((_, i) => i !== idx))}
        hint="Remove existing or add new product images."
      />

      <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
        <input
          type="checkbox"
          id="featured"
          checked={form.isFeatured}
          onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
          className="w-4 h-4 accent-brand-500 rounded"
        />
        <label
          htmlFor="featured"
          className="text-sm text-stone-700 cursor-pointer flex items-center gap-2"
        >
          <Star size={14} className="text-brand-500" /> Featured product
          <span className="text-xs text-stone-400">(appears on storefront homepage)</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
        <Btn variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Btn>
        <Btn type="submit" loading={loading}>
          {loading ? "Saving…" : initial?.id ? "Update Product" : "Create Product"}
        </Btn>
      </div>
    </form>
  );
}

// ─── Variant Form ─────────────────────────────────────────────────────────────
/**
 * Variant images are handled the same way as product images:
 * upload files first via a product-image PUT, then send typed JSON for the variant.
 */
function VariantForm({
  productSlug,
  initial,
  onClose,
}: {
  productSlug: string;
  initial?: ProductVariant;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    color: initial?.color ?? "",
    colorHex: initial?.colorHex ?? "",
    size: initial?.size ?? "",
    sku: initial?.sku ?? "",
    stock: String(initial?.stock ?? "0"),
    priceOverride: initial?.priceOverride != null ? String(initial.priceOverride) : "",
  });

  const [keptImages, setKeptImages] = useState<string[]>(initial?.images ?? []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      const variantPayload = initial?.id
        ? { variants: [{ id: initial.id, ...payload }] }
        : { variants: [payload] };
      // Variant data is typed — send as JSON
      return api.put(`/products/${productSlug}`, variantPayload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(initial ? "Variant updated" : "Variant added");
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalImageUrls = [...keptImages];

    // Step 1: upload new variant images if any, collect URLs
    if (newImageFiles.length > 0) {
      setUploading(true);
      try {
        // Get the current product images to keep them intact during upload
        const productRes = await api.get(`/products/${productSlug}`);
        const currentProduct: Product = productRes.data.data;

        const newUrls = await uploadProductImages(
          productSlug,
          currentProduct.images, // existing product images — preserve these
          newImageFiles,
        );

        // newUrls is the full updated product.images array
        // The newly uploaded ones are those that weren't in currentProduct.images
        const uploadedVariantUrls = newUrls.filter(
          (url) => !currentProduct.images.includes(url),
        );
        finalImageUrls = [...keptImages, ...uploadedVariantUrls];
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        toast.error("Image upload failed: " + (e.response?.data?.message ?? e.message));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Step 2: send typed JSON with the resolved image URLs
    const stock = parseInt(form.stock, 10);
    const payload: Record<string, unknown> = {
      color: form.color || undefined,
      colorHex: form.colorHex || undefined,
      size: form.size || undefined,
      sku: form.sku || undefined,
      stock: isNaN(stock) ? 0 : stock,
      images: finalImageUrls,
    };
    if (form.priceOverride) {
      const po = parseFloat(form.priceOverride);
      if (!isNaN(po)) payload.priceOverride = po;
    }

    mutation.mutate(payload);
  };

  const isBusy = uploading || mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Color">
          <input
            className={inputCls}
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            placeholder="Midnight Black"
          />
        </Field>
        <Field label="Color Hex" hint="e.g. #1A1A1A">
          <div className="flex items-center gap-2">
            {form.colorHex && (
              <div
                className="w-8 h-8 rounded-lg border border-stone-300 shrink-0"
                style={{ backgroundColor: form.colorHex }}
              />
            )}
            <input
              className={`${inputCls} font-mono`}
              value={form.colorHex}
              onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))}
              placeholder="#000000"
            />
          </div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Size">
          <input
            className={inputCls}
            value={form.size}
            onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
            placeholder="Small"
          />
        </Field>
        <Field label="SKU">
          <input
            className={`${inputCls} font-mono`}
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            placeholder="PROD-001-BLK"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock" required>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            required
          />
        </Field>
        <Field label="Price Override (PKR)">
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputCls}
            value={form.priceOverride}
            onChange={(e) => setForm((f) => ({ ...f, priceOverride: e.target.value }))}
            placeholder="Optional"
          />
        </Field>
      </div>

      <ImagePicker
        existingUrls={keptImages}
        newFiles={newImageFiles}
        onExistingRemove={(url) => setKeptImages((p) => p.filter((u) => u !== url))}
        onFilesAdd={(files) => setNewImageFiles((p) => [...p, ...files])}
        onNewRemove={(idx) => setNewImageFiles((p) => p.filter((_, i) => i !== idx))}
        label="Variant Images"
        hint="Images specific to this colour/size."
      />

      <div className="flex justify-end gap-2 pt-2">
        <Btn variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Btn>
        <Btn type="submit" loading={isBusy}>
          {uploading ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Uploading…
            </>
          ) : mutation.isPending ? (
            "Saving…"
          ) : initial ? (
            "Update Variant"
          ) : (
            "Add Variant"
          )}
        </Btn>
      </div>
    </form>
  );
}

// ─── Product Detail (Variants) Modal ─────────────────────────────────────────
function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);

  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) =>
      api.delete(`/products/${product.slug}/variants/${variantId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Variant deleted");
      setDeletingVariantId(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed"),
  });

  return (
    <Modal title={`Variants — ${product.name}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Product summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Price", value: `PKR ${product.price.toLocaleString()}` },
            product.discountPrice
              ? { label: "Sale Price", value: `PKR ${product.discountPrice.toLocaleString()}` }
              : null,
            { label: "Stock", value: product.stock },
            { label: "Category", value: product.category.name },
            { label: "Gender", value: <Badge value={product.gender} /> },
            { label: "Featured", value: product.isFeatured ? "Yes" : "No" },
          ]
            .filter(Boolean)
            .map(
              (item) =>
                item && (
                  <div key={item.label} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <div className="text-xs text-stone-400 mb-1">{item.label}</div>
                    <div className="text-sm font-semibold text-stone-800">{item.value}</div>
                  </div>
                ),
            )}
        </div>

        {product.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.images.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="h-14 w-14 object-cover rounded-xl border border-stone-200"
              />
            ))}
          </div>
        )}

        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.map((t) => (
              <span
                key={t}
                className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600 border border-stone-200"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <hr className="border-stone-100" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-800">
              Variants{" "}
              <span className="text-stone-400 font-normal">({product.variants.length})</span>
            </h3>
            <Btn
              size="sm"
              onClick={() => {
                setShowVariantForm(true);
                setEditingVariant(null);
              }}
            >
              <Plus size={12} /> Add Variant
            </Btn>
          </div>

          {showVariantForm && !editingVariant && (
            <div className="border border-stone-200 rounded-xl p-4 mb-3 bg-stone-50">
              <p className="text-xs font-semibold text-stone-600 mb-3">New Variant</p>
              <VariantForm
                productSlug={product.slug}
                onClose={() => setShowVariantForm(false)}
              />
            </div>
          )}

          {product.variants.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">
              No variants. This product uses base stock only.
            </p>
          ) : (
            <div className="space-y-2">
              {product.variants.map((v) => (
                <div key={v.id}>
                  {editingVariant?.id === v.id ? (
                    <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
                      <VariantForm
                        productSlug={product.slug}
                        initial={v}
                        onClose={() => setEditingVariant(null)}
                      />
                    </div>
                  ) : (
                    <div className="border border-stone-100 rounded-xl p-3 flex items-center justify-between hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {v.colorHex && (
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        {v.images.length > 0 && (
                          <img
                            src={v.images[0]}
                            alt=""
                            className="h-9 w-9 object-cover rounded-lg border border-stone-200"
                          />
                        )}
                        <div className="text-sm">
                          <span className="font-semibold text-stone-800">{v.color ?? "—"}</span>
                          {v.size && <span className="text-stone-400 ml-2">/ {v.size}</span>}
                          {v.sku && (
                            <span className="text-xs text-stone-400 ml-2 font-mono">#{v.sku}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {v.priceOverride && (
                          <span className="text-stone-500 text-xs font-medium">
                            PKR {v.priceOverride}
                          </span>
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            v.stock === 0
                              ? "text-red-600"
                              : v.stock < 5
                              ? "text-amber-600"
                              : "text-stone-600"
                          }`}
                        >
                          {v.stock} in stock
                        </span>
                        {v.images.length > 0 && (
                          <span className="text-xs text-stone-300">{v.images.length} img</span>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingVariant(v);
                              setShowVariantForm(false);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => setDeletingVariantId(v.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deletingVariantId && (
        <ConfirmDialog
          message="Delete this variant? Action is blocked if it's in active carts or orders."
          onConfirm={() => deleteVariantMutation.mutate(deletingVariantId)}
          onCancel={() => setDeletingVariantId(null)}
          loading={deleteVariantMutation.isPending}
        />
      )}
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modal, setModal] = useState<"create" | Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data.data as Category[]),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, search, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      return api.get(`/products?${params}`).then((r) => r.data);
    },
  });

  const categories: Category[] = categoriesData ?? [];
  const products: Product[] = data?.data ?? [];
  const pagination = data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/products/${slug}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      setDeleteTarget(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed to delete"),
  });

  /**
   * Two-step save for products:
   * 1. If new image files exist, upload them via multipart PUT first → get URLs back
   * 2. PATCH/POST with a JSON body containing properly-typed numbers + all image URLs
   *
   * This avoids the 422 the server throws when multer's FormData body parser
   * delivers all fields as strings to a Zod schema that expects number/boolean.
   */
  const handleSave = async (
    payload: ProductPayload,
    newImageFiles: File[],
    isEdit: boolean,
    existingSlug?: string,
  ) => {
    setSavingProduct(true);
    try {
      let finalImages = [...payload.images]; // keptImages from the form

      // Step 1: upload new files if any
      if (newImageFiles.length > 0) {
        if (isEdit && existingSlug) {
          // For edits: use the existing product slug to upload
          finalImages = await uploadProductImages(existingSlug, finalImages, newImageFiles);
        } else {
          // For creates: we don't have a slug yet to upload to.
          // Create the product first without images, then upload.
          const createRes = await api.post("/products", { ...payload, images: [] });
          const created: Product = createRes.data.data;

          // Now upload the images to the newly created product
          finalImages = await uploadProductImages(created.slug, [], newImageFiles);

          // Update with the final image URLs
          await api.put(`/products/${created.slug}`, { images: finalImages });

          qc.invalidateQueries({ queryKey: ["products"] });
          toast.success("Product created");
          setModal(null);
          return;
        }
      }

      // Step 2: send JSON with all typed fields + resolved image URLs
      const body = { ...payload, images: finalImages };

      if (isEdit && existingSlug) {
        await api.put(`/products/${existingSlug}`, body);
        toast.success("Product updated");
      } else {
        await api.post("/products", body);
        toast.success("Product created");
      }

      qc.invalidateQueries({ queryKey: ["products"] });
      setModal(null);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string; errors?: { field: string; message: string }[] } };
        message?: string;
      };
      // Show the first validation error field if available
      const firstError = e.response?.data?.errors?.[0];
      const msg = firstError
        ? `${firstError.field}: ${firstError.message}`
        : e.response?.data?.message ?? e.message ?? "Save failed";
      toast.error(msg);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={
          pagination ? `${pagination.total} product${pagination.total !== 1 ? "s" : ""}` : ""
        }
        action={
          <Btn onClick={() => setModal("create")}>
            <Plus size={14} /> Add Product
          </Btn>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-white"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Btn type="submit" variant="secondary" size="sm">
            Search
          </Btn>
          {search && (
            <Btn
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
            >
              <X size={12} /> Clear
            </Btn>
          )}
        </form>
        <select
          className={`${selectCls} w-48`}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <EmptyState message="No products found." icon={<Package size={32} />} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Images</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Gender</Th>
                <Th>Variants</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="font-semibold text-stone-900 max-w-[180px]">{p.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{p.slug}</div>
                    {p.isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-brand-50 text-brand-600 border border-brand-200 px-1.5 py-0.5 rounded-full mt-1">
                        <Star size={8} /> Featured
                      </span>
                    )}
                  </Td>
                  <Td>
                    {p.images.length > 0 ? (
                      <div className="flex gap-1 items-center">
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-9 w-9 object-cover rounded-lg border border-stone-200"
                        />
                        {p.images.length > 1 && (
                          <span className="text-xs text-stone-400">+{p.images.length - 1}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-stone-300">—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs text-stone-500">{p.category.name}</span>
                  </Td>
                  <Td>
                    <div className="font-semibold text-stone-800 text-xs">
                      PKR {p.price.toLocaleString()}
                    </div>
                    {p.discountPrice && (
                      <div className="text-xs text-brand-600">
                        Sale: PKR {p.discountPrice.toLocaleString()}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <span
                      className={`text-sm font-semibold ${
                        p.stock === 0
                          ? "text-red-600"
                          : p.stock < 5
                          ? "text-amber-600"
                          : "text-stone-700"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </Td>
                  <Td>
                    <Badge value={p.gender} />
                  </Td>
                  <Td>
                    <button
                      onClick={() => setDetailProduct(p)}
                      className="text-xs text-brand-600 hover:text-brand-800 underline underline-offset-2 font-medium"
                    >
                      {p.variants.length} variant{p.variants.length !== 1 ? "s" : ""}
                    </button>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal(p)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPage={setPage}
            />
          )}
        </>
      )}

      {modal === "create" && (
        <Modal title="Create Product" onClose={() => setModal(null)} size="lg">
          <ProductForm
            categories={categories}
            onSubmit={(payload, newFiles) =>
              handleSave(payload, newFiles, false)
            }
            loading={savingProduct}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal && modal !== "create" && (
        <Modal title={`Edit — ${modal.name}`} onClose={() => setModal(null)} size="lg">
          <ProductForm
            initial={modal}
            categories={categories}
            onSubmit={(payload, newFiles) =>
              handleSave(payload, newFiles, true, modal.slug)
            }
            loading={savingProduct}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.slug)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
