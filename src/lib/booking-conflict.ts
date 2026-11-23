import { prisma } from "./prisma";

export interface ConflictCheckParams {
  carId: string;
  pickupDatetime: Date;
  returnDatetime?: Date | null;
  mightExtend: boolean;
  excludeBookingId?: string; // For editing existing booking
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingBooking?: {
    id: string;
    pickupDatetime: Date;
    returnDatetime: Date | null;
    mightExtend: boolean;
    customerName: string | null;
    destination: string;
  };
  reason?: string;
}

/**
 * Evaluates whether a new or updated booking overlaps with any existing booking for the specified car.
 * Handles both fixed date ranges [Start, End] and "Might Extend" open-ended bookings [Start, Infinity).
 */
export async function checkBookingConflict(
  params: ConflictCheckParams
): Promise<ConflictResult> {
  const { carId, pickupDatetime, returnDatetime, mightExtend, excludeBookingId } = params;

  // Retrieve all active bookings for this car (exclude CANCELLED bookings)
  const existingBookings = await prisma.booking.findMany({
    where: {
      carId,
      bookingStatus: { not: "CANCELLED" },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: {
      id: true,
      pickupDatetime: true,
      returnDatetime: true,
      mightExtend: true,
      customerName: true,
      destination: true,
    },
  });

  const newStart = new Date(pickupDatetime).getTime();
  const newEnd = !mightExtend && returnDatetime ? new Date(returnDatetime).getTime() : null;

  for (const existing of existingBookings) {
    const existingStart = new Date(existing.pickupDatetime).getTime();
    const existingEnd = !existing.mightExtend && existing.returnDatetime ? new Date(existing.returnDatetime).getTime() : null;

    // Case 1: Both bookings have fixed end dates
    if (newEnd !== null && existingEnd !== null) {
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      if (newStart < existingEnd && newEnd > existingStart) {
        return {
          hasConflict: true,
          conflictingBooking: existing,
          reason: `Car is already booked from ${new Date(existingStart).toLocaleString()} to ${new Date(existingEnd).toLocaleString()} for ${existing.destination}.`,
        };
      }
    }

    // Case 2: Existing booking is OPEN-ENDED ("Might Extend")
    // The existing booking occupies the car indefinitely starting from existingStart.
    if (existing.mightExtend || existingEnd === null) {
      // If the new booking ends after existingStart or is also open-ended:
      if (newEnd === null || newEnd > existingStart) {
        return {
          hasConflict: true,
          conflictingBooking: existing,
          reason: `Car is currently blocked on an Open-Ended booking starting ${new Date(existingStart).toLocaleString()}. Admin must set a return date before scheduling new trips.`,
        };
      }
    }

    // Case 3: New booking is OPEN-ENDED ("Might Extend")
    // The new booking extends indefinitely starting from newStart.
    if (mightExtend || newEnd === null) {
      // Any existing booking that ends after newStart or starts after newStart conflicts
      if (existingEnd === null || existingEnd > newStart) {
        return {
          hasConflict: true,
          conflictingBooking: existing,
          reason: `This open-ended booking starts at ${new Date(newStart).toLocaleString()}, but overlaps with an existing booking ending at ${existingEnd ? new Date(existingEnd).toLocaleString() : 'indefinite'}.`,
        };
      }
    }
  }

  return { hasConflict: false };
}

