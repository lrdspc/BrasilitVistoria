import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, CheckCircle } from 'lucide-react';
import { NON_CONFORMITY_LIST } from '@shared/schema';

interface VistoriaStatsProps {
  inspections: any[];
  className?: string;
}

export function VistoriaStats({ inspections, className }: VistoriaStatsProps) {
  const stats = useMemo(() => {
    const total = inspections.length;
    const completed = inspections.filter(i => i.status === 'completed').length;
    const pending = inspections.filter(i => i.status === 'pending').length;
    const inProgress = inspections.filter(i => i.status === 'in_progress').length;

    // Non-conformities statistics
    const nonConformityStats = NON_CONFORMITY_LIST.map(title => {
      const count = inspections.reduce((acc, inspection) => {
        const hasNonConformity = inspection.nonConformities?.some((nc: any) => nc.title === title);
        return acc + (hasNonConformity ? 1 : 0);
      }, 0);
      return {
        name: title.replace(/^\d+\.\s*/, ''), // Remove number prefix
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count).slice(0, 8); // Top 8

    // Status distribution
    const statusData = [
      { name: 'Concluídas', value: completed, color: '#10B981' },
      { name: 'Em Andamento', value: inProgress, color: '#F59E0B' },
      { name: 'Pendentes', value: pending, color: '#EF4444' }
    ].filter(item => item.value > 0);

    // Monthly trend (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthInspections = inspections.filter(inspection => {
        const inspectionDate = new Date(inspection.date);
        return inspectionDate.getMonth() === date.getMonth() && 
               inspectionDate.getFullYear() === date.getFullYear();
      });

      monthlyData.push({
        month: monthName,
        total: monthInspections.length,
        completed: monthInspections.filter(i => i.status === 'completed').length,
        pending: monthInspections.filter(i => i.status === 'pending').length
      });
    }

    return {
      total,
      completed,
      pending,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      nonConformityStats,
      statusData,
      monthlyData
    };
  }, [inspections]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Non-Conformities Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Principais Não Conformidades</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.nonConformityStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência Mensal (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10B981" name="Concluídas" />
                <Bar dataKey="pending" stackId="a" fill="#EF4444" name="Pendentes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
