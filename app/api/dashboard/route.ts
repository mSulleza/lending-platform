import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/dashboard
export async function GET(request: NextRequest) {
  try {
    // Get total clients
    const totalClients = await prisma.client.count();

    // Get total loan amount and service charges
    const loanStats = await prisma.loanSchedule.aggregate({
      _sum: {
        loanAmount: true,
        serviceCharge: true,
      },
      _count: {
        id: true,
      },
    });

    // Get active loans (loans where there are future payments)
    const today = new Date();
    const activeLoans = await prisma.loanSchedule.count({
      where: {
        payments: {
          some: {
            dueDate: {
              gte: today,
            },
            isPaid: false,
          },
        },
      },
    });

    // Get payment statistics
    const paymentStats = await prisma.payment.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
      where: {
        isPaid: true,
      },
    });

    // Get all active loan schedules to calculate projected earnings
    const activeSchedules = await prisma.loanSchedule.findMany({
      where: {
        payments: {
          some: {
            isPaid: false,
          },
        },
      },
      include: {
        payments: {
          where: {
            isPaid: false,
          },
        },
      },
    });

    // Calculate projected earnings (remaining payments + service charges)
    let projectedInterestEarnings = 0;
    let projectedTotalEarnings = 0;

    // Calculate total projected earnings from all active loans
    interface Payment {
      amount: number;
      isPaid: boolean;
    }
    
    interface LoanSchedule {
      loanAmount: number;
      serviceCharge?: number;
      payments: Payment[];
    }
    
    activeSchedules.forEach((schedule: LoanSchedule) => {
      // For each loan, calculate total payment amount and subtract loan amount to get interest
      const totalPayments = schedule.payments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
      const principal = schedule.loanAmount;
      const interest = totalPayments - principal;
      
      projectedInterestEarnings += interest;
      // Total earnings include principal + interest + service charge
      projectedTotalEarnings += totalPayments + (schedule.serviceCharge || 0);
    });

    // Get upcoming payments (due in the next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingPayments = await prisma.payment.count({
      where: {
        dueDate: {
          gte: today,
          lte: nextWeek,
        },
        isPaid: false,
      },
    });

    // Get overdue payments
    const overduePayments = await prisma.payment.count({
      where: {
        dueDate: {
          lt: today,
        },
        isPaid: false,
      },
    });

    // Get payment scheme distribution
    const paymentSchemes = await prisma.loanSchedule.groupBy({
      by: ['paymentScheme'],
      _count: {
        id: true,
      },
    });

    // Get recent loans (last 5 loans)
    const recentLoans = await prisma.loanSchedule.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalClients,
      totalLoans: loanStats._count.id,
      totalLoanAmount: loanStats._sum.loanAmount || 0,
      totalServiceCharges: loanStats._sum.serviceCharge || 0,
      activeLoans,
      totalPaidPayments: paymentStats._count.id,
      totalPaidAmount: paymentStats._sum.amount || 0,
      projectedEarnings: projectedTotalEarnings,
      projectedInterestEarnings: projectedInterestEarnings,
      upcomingPayments,
      overduePayments,
      paymentSchemes: paymentSchemes.map((scheme: { paymentScheme: string; _count: { id: number } }) => ({
        scheme: scheme.paymentScheme,
        count: scheme._count.id
      })),
      recentLoans: recentLoans.map((loan: { id: string; loanAmount: number; serviceCharge: number; startDate: Date; paymentScheme: string; client: { firstName: string; lastName: string } }) => ({
        id: loan.id,
        clientName: `${loan.client.firstName} ${loan.client.lastName}`,
        amount: loan.loanAmount,
        serviceCharge: loan.serviceCharge || 0,
        startDate: loan.startDate,
        paymentScheme: loan.paymentScheme,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
} 