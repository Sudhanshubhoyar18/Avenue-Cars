process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Avenue Cars database with CRM and visual specs...");

  // 1. Clear existing records for clean test state
  await prisma.auditLog.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.vendorPayout.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();

  // 2. Seed 2 Admins
  const adminTejas = await prisma.user.create({
    data: {
      name: "Tejas Singh",
      email: "tejas.singh@avenuecars.com",
      role: "ADMIN",
    },
  });

  const adminFalgun = await prisma.user.create({
    data: {
      name: "Falgun",
      email: "falgunkubde@gmail.com",
      role: "ADMIN",
    },
  });

  console.log("Seeded Admins: Tejas Singh & Falgun");

  // 3. Seed CRM Customers
  const custVikram = await prisma.customer.create({
    data: {
      name: "Vikram Malhotra",
      phone: "+91 98230 44556",
      email: "vikram@malhotra.com",
      city: "Pune, MH",
      licenseNumber: "MH1220190012345",
      idProofType: "Aadhaar",
      idProofNumber: "5432 9876 1234",
      tag: "VIP",
      status: "ACTIVE",
      notes: "Prefers automatic SUVs, prompt payments, always returns clean.",
    },
  });

  const custRohan = await prisma.customer.create({
    data: {
      name: "Rohan Deshpande",
      phone: "+91 98220 99887",
      email: "rohan@deshpande.com",
      city: "Mumbai, MH",
      licenseNumber: "MH1420210087654",
      idProofType: "Passport",
      idProofNumber: "Z9876543",
      tag: "REGULAR",
      status: "ACTIVE",
      notes: "Frequently rents Scorpio N for coastal trips to Konkan.",
    },
  });

  const custAditya = await prisma.customer.create({
    data: {
      name: "Aditya Shah",
      phone: "+91 98210 55443",
      email: "aditya@shah.com",
      city: "Nashik, MH",
      licenseNumber: "MH0220230043210",
      idProofType: "Aadhaar",
      idProofNumber: "6543 2109 8765",
      tag: "NEW",
      status: "ACTIVE",
      notes: "First time client, verified driving license.",
    },
  });

  const custSameer = await prisma.customer.create({
    data: {
      name: "Sameer Joshi",
      phone: "+91 98200 11224",
      email: "sameer@joshi.com",
      city: "Pune, MH",
      licenseNumber: "MH1220180054321",
      idProofType: "Aadhaar",
      idProofNumber: "7890 1234 5678",
      tag: "CAUTION",
      status: "ACTIVE",
      notes: "Returned vehicle 3 hours late last time; verify return buffer.",
    },
  });

  console.log("Seeded CRM Customers: Vikram (VIP), Rohan, Aditya, Sameer");

  // 4. Seed 2 Vendors
  const vendorSoham = await prisma.vendor.create({
    data: {
      name: "Soham Deshmukh",
      email: "soham@vendor.com",
      phone: "+91 98230 11223",
      telegramChatId: "598129381", // Pre-linked chat ID for testing
      status: "ACTIVE",
      notes: "Preferred payout mode: UPI (soham@okaxis)",
    },
  });

  const vendorRajesh = await prisma.vendor.create({
    data: {
      name: "Rajesh Patil",
      email: "rajesh@vendor.com",
      phone: "+91 98220 44556",
      telegramChatId: null, // Test pending connection state
      status: "ACTIVE",
      notes: "Account settlement on 1st & 15th of each month",
    },
  });

  // Create linked user records for vendors
  await prisma.user.create({
    data: {
      name: "Soham Deshmukh",
      email: "soham@vendor.com",
      role: "VENDOR",
      vendorId: vendorSoham.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Rajesh Patil",
      email: "rajesh@vendor.com",
      role: "VENDOR",
      vendorId: vendorRajesh.id,
    },
  });

  console.log("Seeded Vendors: Soham & Rajesh");

  // 5. Seed Fleet Cars with Technical Specs
  // Soham's Cars
  const scorpioN = await prisma.car.create({
    data: {
      vendorId: vendorSoham.id,
      makeModel: "Mahindra Scorpio N",
      variant: "Z4",
      color: "Black",
      registrationNumber: "MH 12 AB 1234",
      status: "ON_BOOKING",
      fuelType: "Diesel",
      transmission: "Automatic",
      seatingCapacity: 7,
      dailyRate: 4500,
      notes: "Fastag loaded, comprehensive insurance valid until Oct 2027",
    },
  });

  const xuv700 = await prisma.car.create({
    data: {
      vendorId: vendorSoham.id,
      makeModel: "Mahindra XUV700",
      variant: "AX7L",
      color: "Midnight Blue",
      registrationNumber: "MH 14 CD 5678",
      status: "AVAILABLE",
      fuelType: "Diesel",
      transmission: "Automatic",
      seatingCapacity: 7,
      dailyRate: 5000,
      notes: "ADAS enabled, panoramic sunroof",
    },
  });

  // Rajesh's Cars
  const thar = await prisma.car.create({
    data: {
      vendorId: vendorRajesh.id,
      makeModel: "Mahindra Thar",
      variant: "LX 4x4 Hard Top",
      color: "Rocky Beige",
      registrationNumber: "MH 12 EF 9012",
      status: "AVAILABLE",
      fuelType: "Diesel",
      transmission: "Manual 4x4",
      seatingCapacity: 4,
      dailyRate: 4000,
      notes: "Off-road capable, clean interior",
    },
  });

  const safari = await prisma.car.create({
    data: {
      vendorId: vendorRajesh.id,
      makeModel: "Tata Safari",
      variant: "Dark Edition",
      color: "Oberon Black",
      registrationNumber: "MH 14 GH 3456",
      status: "AVAILABLE",
      fuelType: "Diesel",
      transmission: "Automatic",
      seatingCapacity: 7,
      dailyRate: 4800,
      notes: "7-seater flagship luxury",
    },
  });

  console.log("Seeded Fleet Cars: Scorpio N, XUV700, Thar, Safari with visual specs");

  // 6. Seed Bookings linked to CRM Customers
  const today = new Date();

  // Booking 1: Scorpio N (Soham) - Weekend Lonavala (Vikram Malhotra)
  const pickup1 = new Date(today);
  pickup1.setDate(today.getDate() - 3);
  pickup1.setHours(9, 0, 0, 0);

  const return1 = new Date(today);
  return1.setDate(today.getDate() - 1);
  return1.setHours(21, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      carId: scorpioN.id,
      vendorId: vendorSoham.id,
      customerId: custVikram.id,
      customerName: "Vikram Malhotra",
      pickupDatetime: pickup1,
      returnDatetime: return1,
      destination: "Lonavala & Khandala Ghats",
      totalAmount: 14000,
      amountPaid: 14000,
      amountUnpaid: 0,
      paymentStatus: "PAID",
      mightExtend: false,
      vendorPayoutAmount: 10500,
      bookingStatus: "COMPLETED",
      notes: "Customer returned vehicle with full tank fuel",
      createdBy: "tejas.singh@avenuecars.com",
    },
  });

  // Booking 2: Scorpio N (Soham) - Current Trip with "Might Extend" (Rohan Deshpande)
  const pickup2 = new Date(today);
  pickup2.setDate(today.getDate());
  pickup2.setHours(10, 0, 0, 0);

  const booking2 = await prisma.booking.create({
    data: {
      carId: scorpioN.id,
      vendorId: vendorSoham.id,
      customerId: custRohan.id,
      customerName: "Rohan Deshpande",
      pickupDatetime: pickup2,
      returnDatetime: null, // Open-ended
      destination: "Goa Coastal & Konkan Route",
      totalAmount: 28000,
      amountPaid: 10000,
      amountUnpaid: 18000,
      paymentStatus: "PARTIALLY_PAID",
      mightExtend: true, // Open-ended
      vendorPayoutAmount: 21000,
      bookingStatus: "CONFIRMED",
      notes: "Customer might extend trip depending on weather",
      createdBy: "falgunkubde@gmail.com",
    },
  });

  // Booking 3: Thar (Rajesh) - Upcoming Mahabaleshwar (Aditya Shah)
  const pickup3 = new Date(today);
  pickup3.setDate(today.getDate() + 4);
  pickup3.setHours(7, 30, 0, 0);

  const return3 = new Date(today);
  return3.setDate(today.getDate() + 7);
  return3.setHours(20, 0, 0, 0);

  const booking3 = await prisma.booking.create({
    data: {
      carId: thar.id,
      vendorId: vendorRajesh.id,
      customerId: custAditya.id,
      customerName: "Aditya Shah",
      pickupDatetime: pickup3,
      returnDatetime: return3,
      destination: "Mahabaleshwar & Panchgani",
      totalAmount: 18500,
      amountPaid: 5000,
      amountUnpaid: 13500,
      paymentStatus: "PARTIALLY_PAID",
      mightExtend: false,
      vendorPayoutAmount: 13800,
      bookingStatus: "CONFIRMED",
      notes: "Advance ₹5,000 received via GPay",
      createdBy: "tejas.singh@avenuecars.com",
    },
  });

  console.log("Seeded Bookings (including Open-ended trip)");

  // 7. Seed Vendor Payouts
  await prisma.vendorPayout.create({
    data: {
      vendorId: vendorSoham.id,
      amount: 10500,
      paymentMethod: "UPI",
      referenceId: "UPI/412984192841/GPay",
      notes: "Full settlement for Lonavala trip (Vikram Malhotra)",
      createdBy: "falgunkubde@gmail.com",
    },
  });

  console.log("Seeded Payouts");

  // 8. Seed Notification Logs
  await prisma.notificationLog.create({
    data: {
      bookingId: booking2.id,
      vendorId: vendorSoham.id,
      channel: "EMAIL",
      eventType: "BOOKING_CREATED",
      status: "SENT",
      recipient: "soham@vendor.com",
      payload: JSON.stringify({ subject: "Confirmed Booking: Scorpio N", total: 28000 }),
      retryCount: 0,
      lastAttemptedAt: new Date(),
    },
  });

  await prisma.notificationLog.create({
    data: {
      bookingId: booking2.id,
      vendorId: vendorSoham.id,
      channel: "TELEGRAM",
      eventType: "BOOKING_CREATED",
      status: "SENT",
      recipient: "598129381",
      payload: JSON.stringify({ destination: "Goa Coastal & Konkan Route" }),
      retryCount: 0,
      lastAttemptedAt: new Date(),
    },
  });

  console.log("Seeded Notification Logs");

  // 9. Seed Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: adminTejas.id,
      userEmail: adminTejas.email,
      action: "BOOKING_CREATE",
      entityType: "BOOKING",
      entityId: booking1.id,
      details: JSON.stringify({ car: "MH 12 AB 1234", destination: "Lonavala", customer: "Vikram Malhotra" }),
    },
  });

  console.log("Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
