import { type NextRequest, NextResponse } from "next/server";

import { enrollUserInCourse } from "~/server/actions/estudiantes/courses/enrollIndividualCourse";
import { verifySignature } from "~/utils/paygateway/verifySignature";

export const dynamic = "force-dynamic";

interface CoursePaymentData {
  email_buyer: string;
  state_pol: string;
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
  sign: string;
}

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 },
    );
  }

  try {
    const formData = await req.formData();
    const sign = formData.get("sign");

    if (!sign || typeof sign !== "string") {
      console.error("❌ Error: No signature received");
      return NextResponse.json(
        { message: "Missing signature" },
        { status: 400 },
      );
    }

    const paymentData: CoursePaymentData = {
      email_buyer: formData.get("email_buyer") as string,
      state_pol: formData.get("state_pol") as string,
      merchant_id: formData.get("merchant_id") as string,
      reference_sale: formData.get("reference_sale") as string,
      value: formData.get("value") as string,
      currency: formData.get("currency") as string,
      sign: sign,
    };

    console.log("🎓 Course payment data:", paymentData);

    if (!verifySignature(paymentData)) {
      console.error("❌ Invalid signature for course payment");
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 400 },
      );
    }

    // Solo inscribir si el pago fue aprobado (state_pol === '4')
    if (paymentData.state_pol === "4") {
      const match = /^C(\d+)T/.exec(paymentData.reference_sale);
      if (!match) {
        console.error(
          "❌ Invalid reference format:",
          paymentData.reference_sale,
        );
        return NextResponse.json(
          { error: "Invalid reference format" },
          { status: 400 },
        );
      }

      const courseId = parseInt(match[1], 10);
      const email = paymentData.email_buyer?.trim().toLowerCase();

      console.log("✅ Processing enrollment:", {
        courseId,
        email,
      });

      if (!email || !courseId) {
        console.error("❌ Missing email or courseId for enrollment");
        return NextResponse.json(
          { error: "Missing email or courseId" },
          { status: 400 },
        );
      }

      try {
        const result = await enrollUserInCourse(email, courseId);

        return NextResponse.json({
          message: "Course payment confirmed and enrollment successful",
          status: "APPROVED",
          courseId,
          result,
        });
      } catch (enrollError) {
        console.error("❌ Enrollment failed:", enrollError);
        return NextResponse.json(
          {
            error: "Enrollment failed",
            details:
              enrollError instanceof Error
                ? enrollError.message
                : "Unknown error",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      message: "Payment processed but not approved",
      status: paymentData.state_pol,
    });
  } catch (error) {
    console.error("❌ Error in course payment confirmation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
