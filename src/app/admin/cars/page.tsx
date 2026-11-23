"use client";

import React, { useState, useEffect } from "react";
import {
  Car,
  Plus,
  Edit,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Fuel,
  Gauge,
  Users,
  IndianRupee,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CarSilhouette } from "@/components/ui/CarSilhouette";
import { Modal } from "@/components/ui/Modal";
import { formatINR } from "@/lib/utils";

export default function AdminCarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<any | null>(null);

  // Form states
  const [vendorId, setVendorId] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [variant, setVariant] = useState("");
  const [color, setColor] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [fuelType, setFuelType] = useState("Diesel");
  const [transmission, setTransmission] = useState("Automatic");
  const [seatingCapacity, setSeatingCapacity] = useState<number | string>(7);
  const [dailyRate, setDailyRate] = useState<number | string>(4500);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [carsRes, vendorsRes] = await Promise.all([
        fetch("/api/admin/cars"),
        fetch("/api/admin/vendors"),
      ]);
      const carsData = await carsRes.json();
      const vendorsData = await vendorsRes.json();
      if (carsData.cars) setCars(carsData.cars);
      if (vendorsData.vendors) setVendors(vendorsData.vendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingCar(null);
    setVendorId(vendors.length > 0 ? vendors[0].id : "");
    setMakeModel("");
    setVariant("");
    setColor("");
    setRegistrationNumber("");
    setStatus("AVAILABLE");
    setFuelType("Diesel");
    setTransmission("Automatic");
    setSeatingCapacity(7);
    setDailyRate(4500);
    setNotes("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (car: any) => {
    setEditingCar(car);
    setVendorId(car.vendorId);
    setMakeModel(car.makeModel);
    setVariant(car.variant || "");
    setColor(car.color || "");
    setRegistrationNumber(car.registrationNumber);
    setStatus(car.status);
    setFuelType(car.fuelType || "Diesel");
    setTransmission(car.transmission || "Automatic");
    setSeatingCapacity(car.seatingCapacity || 7);
    setDailyRate(car.dailyRate || 4500);
    setNotes(car.notes || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !makeModel || !registrationNumber) {
      setFormError("Vendor, make/model, and registration number are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const url = "/api/admin/cars";
      const method = editingCar ? "PUT" : "POST";
      const payload: any = {
        vendorId,
        makeModel,
        variant,
        color,
        registrationNumber,
        status,
        fuelType,
        transmission,
        seatingCapacity: parseInt(String(seatingCapacity)) || 7,
        dailyRate: parseFloat(String(dailyRate)) || 4500,
        notes,
      };
      if (editingCar) payload.id = editingCar.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save car");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Fleet Showcase & Garage
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              {cars.length} Vehicles
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual fleet profiles, vendor ownership, technical specifications, and base rental rates.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-accent px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Fleet Cards Grid with Visuals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cars.map((car) => (
          <GlassCard key={car.id} className="p-5 flex flex-col justify-between hoverEffect">
            <div>
              {/* Visual Silhouette */}
              <CarSilhouette makeModel={car.makeModel} color={car.color} className="h-32 mb-4" />

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {car.makeModel}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {car.variant} • {car.color}
                  </p>
                </div>
                <StatusBadge type="car" status={car.status} />
              </div>

              {/* Specs Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Fuel className="w-3 h-3 text-indigo-500" />
                  <span>{car.fuelType || "Diesel"}</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Gauge className="w-3 h-3 text-emerald-500" />
                  <span>{car.transmission || "Automatic"}</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Users className="w-3 h-3 text-amber-500" />
                  <span>{car.seatingCapacity || 7} Seater</span>
                </span>
              </div>

              {/* Reg & Vendor Info Card */}
              <div className="mt-4 p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Reg Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {car.registrationNumber}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Assigned Vendor</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {car.vendor?.name}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Base Daily Rate</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatINR(car.dailyRate || 4500)} / day
                  </span>
                </div>
              </div>

              {car.notes && (
                <p className="text-xs text-slate-500 mt-3 italic line-clamp-2">
                  "{car.notes}"
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {car.bookings?.length || 0} active trips
              </span>
              <button
                onClick={() => openEditModal(car)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                <span>Edit Car</span>
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Add / Edit Car Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCar ? "Edit Vehicle" : "Add Vehicle to Fleet"}
        subtitle="Specify make, model, registration, specs, and vendor"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCar} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Assigned Vendor *
            </label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white font-medium"
              required
            >
              <option value="">-- Select Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Make & Model *
              </label>
              <input
                type="text"
                value={makeModel}
                onChange={(e) => setMakeModel(e.target.value)}
                placeholder="e.g. Mahindra Scorpio N"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Variant
              </label>
              <input
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. Z4 / Diesel AT"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Deep Forest Black"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Registration Number *
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. MH 12 AB 1234"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white uppercase font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2 text-xs glass-input text-slate-900 dark:text-white"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full px-3 py-2 text-xs glass-input text-slate-900 dark:text-white"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="Manual 4x4">Manual 4x4</option>
                <option value="Auto 4x4">Auto 4x4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Base Daily Rate (₹)
              </label>
              <input
                type="number"
                min="500"
                step="100"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full px-3 py-2 text-xs glass-input text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Seating Capacity
              </label>
              <select
                value={seatingCapacity}
                onChange={(e) => setSeatingCapacity(e.target.value)}
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-medium"
              >
                <option value="4">4 Seater</option>
                <option value="5">5 Seater</option>
                <option value="7">7 Seater</option>
                <option value="8">8 Seater</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Vehicle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-medium"
              >
                <option value="AVAILABLE">Available for Rent</option>
                <option value="ON_BOOKING">On Active Trip</option>
                <option value="MAINTENANCE">Maintenance / Service</option>
                <option value="INACTIVE">Inactive / Off Fleet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Vehicle Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Insurance expiry, Fastag ID, condition..."
              className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-accent px-5 py-2 rounded-2xl text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingCar ? "Update Vehicle" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
