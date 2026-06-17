"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { MapPin, Plus, Pencil, Trash2, Star, Check, Home } from "lucide-react";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/api/addresses";
import type { Address, CreateAddressInput } from "@/types/api";
import { cn } from "@/lib/utils";

type FormVals = {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const inputClass =
  "w-full h-11 px-4 border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all placeholder:text-[var(--color-text-muted)]/60";

const labelClass =
  "block text-[10px] tracking-[0.22em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-2";

function AddrForm({
  defaults,
  onSubmit,
  onCancel,
  pending,
  cta,
}: {
  defaults?: Partial<FormVals>;
  onSubmit: (d: FormVals) => void;
  onCancel: () => void;
  pending: boolean;
  cta: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormVals>({ defaultValues: defaults });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>
          Label{" "}
          <span className="normal-case tracking-normal text-[9px] opacity-50 font-normal">optional</span>
        </label>
        <input
          {...register("label")}
          placeholder="e.g. Home, Office"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Street Address</label>
        <input
          {...register("street", { required: "Required" })}
          placeholder="House 12, Street 3, DHA"
          className={cn(inputClass, errors.street && "border-[var(--color-danger)] bg-red-50/50")}
        />
        {errors.street && (
          <p className="text-[11px] text-[var(--color-danger)] mt-1.5">{errors.street.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>City</label>
          <input
            {...register("city", { required: "Required" })}
            placeholder="Karachi"
            className={cn(inputClass, errors.city && "border-[var(--color-danger)] bg-red-50/50")}
          />
          {errors.city && (
            <p className="text-[11px] text-[var(--color-danger)] mt-1.5">{errors.city.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Province</label>
          <input
            {...register("state", { required: "Required" })}
            placeholder="Sindh"
            className={cn(inputClass, errors.state && "border-[var(--color-danger)] bg-red-50/50")}
          />
          {errors.state && (
            <p className="text-[11px] text-[var(--color-danger)] mt-1.5">{errors.state.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Postal Code</label>
          <input
            {...register("postalCode", { required: "Required" })}
            placeholder="75500"
            className={cn(inputClass, errors.postalCode && "border-[var(--color-danger)] bg-red-50/50")}
          />
          {errors.postalCode && (
            <p className="text-[11px] text-[var(--color-danger)] mt-1.5">{errors.postalCode.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input
            {...register("country", { required: "Required" })}
            placeholder="Pakistan"
            className={cn(inputClass, errors.country && "border-[var(--color-danger)] bg-red-50/50")}
          />
          {errors.country && (
            <p className="text-[11px] text-[var(--color-danger)] mt-1.5">{errors.country.message}</p>
          )}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="h-11 px-7 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {pending ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : cta}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-6 border border-[var(--color-border)] text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddrCard({
  addr,
  editing,
  onEdit,
  onClose,
}: {
  addr: Address;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const upd = useMutation({
    mutationFn: (d: FormVals) => updateAddress(addr.id, d as CreateAddressInput),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["addresses"] }); toast.success("Updated"); onClose(); },
    onError: () => toast.error("Failed to update"),
  });
  const del = useMutation({
    mutationFn: () => deleteAddress(addr.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["addresses"] }); toast.success("Deleted"); },
    onError: () => toast.error("Failed to delete"),
  });
  const def = useMutation({
    mutationFn: () => setDefaultAddress(addr.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["addresses"] }); toast.success("Default updated"); },
    onError: () => toast.error("Failed to update default"),
  });

  return (
    <div className={cn(
      "bg-white border overflow-hidden transition-all duration-200",
      addr.isDefault
        ? "border-[var(--color-accent)] shadow-sm"
        : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40",
    )}>
      {editing ? (
        <div className="p-5">
          <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-5">
            Edit Address
          </p>
          <AddrForm
            defaults={{
              label: addr.label,
              street: addr.street,
              city: addr.city,
              state: addr.state,
              postalCode: addr.postalCode,
              country: addr.country,
            }}
            onSubmit={(d) => upd.mutate(d)}
            onCancel={onClose}
            pending={upd.isPending}
            cta="Save Changes"
          />
        </div>
      ) : (
        <>
          {/* Default badge strip */}
          {addr.isDefault && (
            <div className="bg-[var(--color-accent)] px-5 py-1.5 flex items-center gap-1.5">
              <Check size={9} strokeWidth={2.5} className="text-white" />
              <span className="text-[9px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-bold text-white">
                Default Address
              </span>
            </div>
          )}
          <div className="p-5 flex items-start gap-4">
            <div className={cn(
              "w-9 h-9 flex items-center justify-center shrink-0 mt-0.5",
              addr.isDefault ? "bg-[var(--color-accent-light)]" : "bg-[var(--color-surface)]",
            )}>
              <MapPin
                size={15}
                strokeWidth={1.5}
                className={addr.isDefault ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}
              />
            </div>
            <div className="flex-1 min-w-0">
              {addr.label && (
                <p className="text-[10px] tracking-[0.18em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-primary)] mb-1.5">
                  {addr.label}
                </p>
              )}
              <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] leading-relaxed">
                {addr.street}<br />
                {addr.city}, {addr.state} {addr.postalCode}<br />
                {addr.country}
              </p>

              <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-[var(--color-border)]">
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <Pencil size={11} /> Edit
                </button>
                <span className="text-[var(--color-border)]">·</span>
                <button
                  onClick={() => { if (window.confirm("Delete this address?")) del.mutate(); }}
                  disabled={del.isPending}
                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-danger)] hover:opacity-70 transition-opacity disabled:opacity-40"
                >
                  <Trash2 size={11} /> {del.isPending ? "Deleting…" : "Delete"}
                </button>
                {!addr.isDefault && (
                  <>
                    <span className="text-[var(--color-border)]">·</span>
                    <button
                      onClick={() => def.mutate()}
                      disabled={def.isPending}
                      className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40"
                    >
                      <Star size={11} /> {def.isPending ? "Updating…" : "Set Default"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AddressesPage() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: addrs, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
  });

  const create = useMutation({
    mutationFn: (d: FormVals) => createAddress(d as CreateAddressInput),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added");
      setShowAdd(false);
    },
    onError: () => toast.error("Failed to add address"),
  });

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-3xl font-light text-[var(--color-primary)]">
            Saved Addresses
          </h1>
          {!isLoading && addrs && addrs.length > 0 && (
            <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-1">
              {addrs.length} {addrs.length === 1 ? "address" : "addresses"} saved
            </p>
          )}
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 h-10 px-5 bg-[var(--color-primary)] text-white text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors shrink-0"
          >
            <Plus size={13} strokeWidth={2} /> Add New
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-[var(--color-primary)] p-6 mb-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[var(--color-border)]">
            <Home size={13} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
            <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)]">
              New Address
            </p>
          </div>
          <AddrForm
            onSubmit={(d) => create.mutate(d)}
            onCancel={() => setShowAdd(false)}
            pending={create.isPending}
            cta="Add Address"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-[var(--color-border)] h-32 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!addrs || addrs.length === 0) && !showAdd && (
        <div className="bg-white border border-[var(--color-border)] py-16 text-center px-8">
          <div className="w-14 h-14 bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-4">
            <MapPin size={22} strokeWidth={1} className="text-[var(--color-border)]" />
          </div>
          <p className="font-display text-xl font-light text-[var(--color-primary)] mb-2">
            No addresses yet
          </p>
          <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mb-6">
            Add an address to speed up checkout.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 h-10 px-6 bg-[var(--color-primary)] text-white text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors"
          >
            <Plus size={12} strokeWidth={2} /> Add Address
          </button>
        </div>
      )}

      {/* Cards */}
      {!isLoading && addrs && addrs.length > 0 && (
        <div className="space-y-3">
          {addrs.map((a) => (
            <AddrCard
              key={a.id}
              addr={a}
              editing={editId === a.id}
              onEdit={() => setEditId(a.id)}
              onClose={() => setEditId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
