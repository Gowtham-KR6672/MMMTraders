export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Sale from '@/models/Sale';
import Income from '@/models/Income';

export async function GET() {
  try {
    await connectToDatabase();

    // Aggregate totals
    // Calculate total invoiced sales
    const salesAggregation = await Sale.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
    const totalSales = salesAggregation[0]?.total || 0;

    // Calculate actual collected money from sales
    const salesCollectedAggregation = await Sale.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }]);
    const salesCollected = salesCollectedAggregation[0]?.total || 0;

    // Calculate standalone income
    const incomeAggregation = await Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
    const standaloneIncome = incomeAggregation[0]?.total || 0;

    // Calculate total pending balance (money owed by customers)
    const pendingAggregation = await Sale.aggregate([{ $group: { _id: null, total: { $sum: '$balanceAmount' } } }]);
    const totalPending = pendingAggregation[0]?.total || 0;

    // User requirement: automatically calculate income based on sales
    const totalIncome = standaloneIncome + salesCollected;

    // Monthly Analytics (Simplified for MVP, grouping by month)
    const salesByMonth = await Sale.aggregate([
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const incomeByMonth = await Income.aggregate([
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Format for Recharts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAnalytics = months.map((month, index) => {
      const monthSale = salesByMonth.find(s => s._id === index + 1)?.total || 0;
      const monthIncome = incomeByMonth.find(e => e._id === index + 1)?.total || 0;
      return {
        name: month,
        Sales: monthSale,
        Income: monthIncome
      };
    });

    return NextResponse.json({
      totalSales,
      totalIncome,
      totalPending,
      monthlyAnalytics
    }, { status: 200 });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
