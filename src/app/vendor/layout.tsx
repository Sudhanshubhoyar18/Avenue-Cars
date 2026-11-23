import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VendorNavigation } from "@/components/navigation/VendorNavigation";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // If Admin is inspecting vendor portal, allow them to view or select a vendor
  // If Vendor, verify vendorId exists
  if (user.role === "VENDOR" && !user.vendorId) {
    // Attempt lookup by email
    const vendor = await prisma.vendor.findUnique({
      where: { email: user.email },
    });
    if (!vendor) {
      redirect("/login?error=AccessDenied");
    }
  }

  return (
    <div>
      <VendorNavigation />
      {children}
    </div>
  );
}

