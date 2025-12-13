import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, AlertCircle, CheckCircle, Clock, Phone, Mail, MessageSquare, Download, RefreshCw, Settings, Bell, Search, Filter, Calendar, Activity } from 'lucide-react';

const MedSpaCompleteSystem = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    booked: 0,
    conversionRate: 0,
    avgResponseTime: 0
  });
  const [timeRange, setTimeRange] = useState('7days');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSystemData();
  }, [timeRange]);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, statusFilter, leads]);

  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      const result = await window.storage.list('lead:');
      if (result && result.keys && result.keys.length > 0) {
        const loadedLeads = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key);
              return data ? JSON.parse(data.value) : null;
            } catch (e) {
              return null;
            }
          })
        );
        
        const validLeads = loadedLeads.filter(lead => lead !== null);
        setLeads(validLeads);
        calculateStats(validLeads);
      } else {
        generateSampleData();
      }
    } catch (error) {
      console.log('Loading data:', error);
      generateSampleData();
    }
    setIsLoading(false);
  };

  const generateSampleData = () => {
    const treatments = ['Botox', 'Dermal Fillers', 'Laser Treatment', 'Medical Facials', 'Chemical Peels'];
    const statuses = ['New', 'Contacted', 'Qualified', 'Booked', 'Lost'];
    const sampleLeads = Array.from({ length: 25 }, (_, i) => ({
      id: `lead-${i + 1}`,
      name: `Lead ${i + 1}`,
      email: `lead${i + 1}@example.com`,
      phone: `+234 ${Math.floor(800 + Math.random() * 99)} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(1000 + Math.random() * 8999)}`,
      treatment: treatments[Math.floor(Math.random() * treatments.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      availability: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
      source: 'Landing page',
      message: 'Interested in consultation',
      created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      responseTime: Math.floor(Math.random() * 48)
    }));
    setLeads(sampleLeads);
    calculateStats(sampleLeads);
  };

  const calculateStats = (leadsData) => {
    const statusCounts = leadsData.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const avgResponse = leadsData.reduce((sum, lead) => sum + (lead.responseTime || 0), 0) / leadsData.length || 0;

    setStats({
      total: leadsData.length,
      new: statusCounts['New'] || 0,
      contacted: statusCounts['Contacted'] || 0,
      booked: statusCounts['Booked'] || 0,
      conversionRate: leadsData.length > 0 ? ((statusCounts['Booked'] || 0) / leadsData.length * 100).toFixed(1) : 0,
      avgResponseTime: avgResponse.toFixed(1)
    });
  };

  const filterLeads = () => {
    let filtered = [...leads];
    
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    setFilteredLeads(filtered);
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    const updatedLeads = leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    );
    setLeads(updatedLeads);
    
    try {
      const lead = updatedLeads.find(l => l.id === leadId);
      await window.storage.set(`lead:${leadId}`, JSON.stringify(lead));
      addNotification(`Lead ${lead.name} updated to ${newStatus}`, 'success');
    } catch (error) {
      console.log('Error updating lead:', error);
    }
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 5));
  };

  const exportData = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Treatment', 'Status', 'Availability', 'Created'],
      ...leads.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        lead.treatment,
        lead.status,
        lead.availability,
        new Date(lead.created).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medspa-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addNotification('Data exported successfully', 'success');
  };

  // Chart data
  const treatmentData = leads.reduce((acc, lead) => {
    const existing = acc.find(item => item.name === lead.treatment);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: lead.treatment, value: 1 });
    }
    return acc;
  }, []);

  const statusData = [
    { name: 'New', value: stats.new, color: '#3b82f6' },
    { name: 'Contacted', value: stats.contacted, color: '#f59e0b' },
    { name: 'Qualified', value: leads.filter(l => l.status === 'Qualified').length, color: '#8b5cf6' },
    { name: 'Booked', value: stats.booked, color: '#10b981' },
    { name: 'Lost', value: leads.filter(l => l.status === 'Lost').length, color: '#ef4444' },
  ].filter(s => s.value > 0);

  const dailyTrend = leads.reduce((acc, lead) => {
    const date = new Date(lead.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.leads += 1;
      if (lead.status === 'Booked') existing.booked += 1;
    } else {
      acc.push({ date, leads: 1, booked: lead.status === 'Booked' ? 1 : 0 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-shadow" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold mb-1" style={{ color }}>{value}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} className={trend < 0 ? 'rotate-180' : ''} />
              <span className="ml-1">{Math.abs(trend)}% vs last period</span>
            </div>
          )}
        </div>
        <div className="p-4 rounded-full" style={{ backgroundColor: `${color}15` }}>
          <Icon size={32} style={{ color }} />
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Leads"
          value={stats.total}
          subtitle="All time"
          color="#667eea"
          trend={12}
        />
        <StatCard
          icon={Clock}
          title="New Leads"
          value={stats.new}
          subtitle="Awaiting contact"
          color="#f59e0b"
          trend={-5}
        />
        <StatCard
          icon={CheckCircle}
          title="Booked"
          value={stats.booked}
          subtitle="Consultations"
          color="#10b981"
          trend={8}
        />
        <StatCard
          icon={TrendingUp}
          title="Conversion"
          value={`${stats.conversionRate}%`}
          subtitle={`Avg response: ${stats.avgResponseTime}h`}
          color="#8b5cf6"
          trend={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Lead & Booking Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#667eea" strokeWidth={2} name="Leads" />
              <Line type="monotone" dataKey="booked" stroke="#10b981" strokeWidth={2} name="Booked" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Treatment Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={treatmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {treatmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Lead Status Pipeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const LeadsView = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Booked">Booked</option>
            <option value="Lost">Lost</option>
          </select>
          
          <button
            onClick={exportData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Treatment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Availability</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{lead.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{lead.email}</div>
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.treatment}</td>
                  <td className="px-6 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                        lead.status === 'Booked' ? 'bg-green-100 text-green-800' :
                        lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'Qualified' ? 'bg-purple-100 text-purple-800' :
                        lead.status === 'Lost' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Booked">Booked</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.availability}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(lead.created).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Call">
                        <Phone size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Email">
                        <Mail size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No leads found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );

  const ActivityView = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`p-4 rounded-lg border-l-4 ${
              notif.type === 'success' ? 'bg-green-50 border-green-500' :
              notif.type === 'error' ? 'bg-red-50 border-red-500' :
              'bg-blue-50 border-blue-500'
            }`}>
              <div className="flex items-start gap-3">
                <Activity size={20} className={
                  notif.type === 'success' ? 'text-green-600' :
                  notif.type === 'error' ? 'text-red-600' :
                  'text-blue-600'
                } />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Med Spa Management
              </h1>
              <p className="text-gray-600 mt-1">Complete Lead Tracking System</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
              <button
                onClick={loadSystemData}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'leads', label: 'Leads', icon: Users },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'leads' && <LeadsView />}
        {activeTab === 'activity' && <ActivityView />}
      </div>
    </div>
  );
};

export default MedSpaCompleteSystem;