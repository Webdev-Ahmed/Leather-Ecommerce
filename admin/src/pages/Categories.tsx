import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Category } from "../types";
import {
  PageHeader,
  Modal,
  ConfirmDialog,
  Field,
  inputCls,
  EmptyState,
  Spinner,
  Table,
  Th,
  Td,
  Tr,
  Btn,
} from "../components/ui";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import toast from "react-hot-toast";

function CategoryForm({
  initial,
  onSubmit,
  loading,
  onClose,
}: {
  initial?: Partial<Category>;
  onSubmit: (data: FormData) => void;
  loading: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!initial?.slug) {
      setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name);
    fd.append("slug", slug);
    if (image) fd.append("image", image);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Name" required>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          placeholder="e.g. Wallets"
        />
      </Field>

      <Field label="Slug" required hint="Lowercase letters, numbers, hyphens only">
        <input
          className={`${inputCls} font-mono`}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="[a-z0-9-]+"
          placeholder="wallets"
        />
      </Field>

      <Field label="Category Image" hint="Replaces existing image if provided.">
        <div className="flex items-start gap-4">
          {(preview ?? initial?.image) && (
            <img
              src={preview ?? initial?.image}
              alt="preview"
              className="w-20 h-20 object-cover rounded-xl border border-stone-200"
            />
          )}
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded-lg text-sm text-stone-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              Choose image
            </label>
            {image && <p className="text-xs text-stone-400 mt-1">{image.name}</p>}
          </div>
        </div>
      </Field>

      <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
        <Btn variant="secondary" type="button" onClick={onClose}>Cancel</Btn>
        <Btn type="submit" loading={loading}>
          {initial?.id ? "Update Category" : "Create Category"}
        </Btn>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data.data as Category[]),
  });

  const createMutation = useMutation({
    mutationFn: (fd: FormData) =>
      api.post("/categories", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
      setModal(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ slug, fd }: { slug: string; fd: FormData }) =>
      api.put(`/categories/${slug}`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
      setModal(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/categories/${slug}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
      setDeleteTarget(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed to delete"),
  });

  const categories: Category[] = data ?? [];

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} product categor${categories.length !== 1 ? "ies" : "y"}`}
        action={
          <Btn onClick={() => setModal("create")}>
            <Plus size={14} /> Add Category
          </Btn>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : categories.length === 0 ? (
        <EmptyState message="No categories yet. Create one to get started." icon={<Tags size={32} />} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Category</Th>
              <Th>Slug</Th>
              <Th>Image</Th>
              <Th>Created</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <Tr key={cat.id}>
                <Td>
                  <span className="font-semibold text-stone-900">{cat.name}</span>
                </Td>
                <Td>
                  <code className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">
                    {cat.slug}
                  </code>
                </Td>
                <Td>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-9 w-9 object-cover rounded-lg border border-stone-200"
                    />
                  ) : (
                    <span className="text-xs text-stone-300">—</span>
                  )}
                </Td>
                <Td>
                  <span className="text-xs text-stone-400">
                    {new Date(cat.createdAt).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => setModal(cat)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {modal === "create" && (
        <Modal title="Create Category" onClose={() => setModal(null)}>
          <CategoryForm
            onSubmit={(fd) => createMutation.mutate(fd)}
            loading={createMutation.isPending}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal && modal !== "create" && (
        <Modal title={`Edit — ${modal.name}`} onClose={() => setModal(null)}>
          <CategoryForm
            initial={modal}
            onSubmit={(fd) => updateMutation.mutate({ slug: modal.slug, fd })}
            loading={updateMutation.isPending}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete category "${deleteTarget.name}"? Products in this category will be affected.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.slug)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
