import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function PaymentAnalytics() {
  const { data: preferences } = useQuery({
    queryKey: ["/api/analytics/user-preferences"],
  });

  // Process preferences data for charts
  const preferenceData = preferences?.preferences?.map((pref: any) => ({
    method: pref.paymentMethod === 'link' ? 'Payment Link' : 'Auto Payment',
    count: pref.count,
  })) || [];

  const totalSelections = preferenceData.reduce((sum: number, item: any) => sum + item.count, 0);
  const linkPercentage = preferenceData.find((item: any) => item.method === 'Payment Link')?.count || 0;
  const linkPercent = totalSelections > 0 ? Math.round((linkPercentage / totalSelections) * 100) : 0;

  // Estimated cost savings (assuming $0.12 per Plaid API call avoided)
  const estimatedSavings = linkPercentage * 0.12;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Method Preference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkPercent}%</div>
            <p className="text-xs text-muted-foreground">
              Users prefer Payment Links (safer, simpler)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Monthly Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From reduced Plaid API usage
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bill Setups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSelections}</div>
            <p className="text-xs text-muted-foreground">
              Payment methods configured
            </p>
          </CardContent>
        </Card>
      </div>

      {preferenceData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={preferenceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, percent }: any) => `${method}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {preferenceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={preferenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Hybrid Payment Model</h4>
                <p className="text-sm text-gray-600">Default to Payment Links, optional Auto-Pay</p>
              </div>
              <div className="text-green-600 font-medium">
                ✓ {linkPercent}% adoption
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Plaid API Cost Reduction</h4>
                <p className="text-sm text-gray-600">Reduced API calls through payment links</p>
              </div>
              <div className="text-green-600 font-medium">
                ${estimatedSavings.toFixed(2)}/month saved
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Recommendation</h4>
              <p className="text-sm text-blue-700 mt-1">
                Continue promoting Payment Links as the default option. The high adoption rate shows users 
                prefer the simpler, safer approach while significantly reducing operational costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}