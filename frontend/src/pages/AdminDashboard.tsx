import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Box, 
  CircularProgress,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import { 
  People, 
  Assignment, 
  HourglassEmpty, 
  CheckCircle, 
  ErrorOutline, 
  Search, 
  FileDownload,
  Visibility
} from '@mui/icons-material';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch metrics
      const metricsRes = await fetch('/api/admin/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      // 2. Fetch submissions
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (status) queryParams.append('status', status);

      const appsRes = await fetch(`/api/admin/applications?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApps(appsData);
      }
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, status]);

  // Trigger search on enter or button click
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchDashboardData();
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    window.open(`/api/admin/export/csv?token=${token}`, '_blank');
  };

  // Excel Export Trigger
  const handleExportExcel = () => {
    window.open(`/api/admin/export/excel?token=${token}`, '_blank');
  };

  if (loading && !metrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-1 md:p-4">
      {/* Title */}
      <Box className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <Box>
          <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
            Verify payment screenshots, audit status tracks, and export applicant logs.
          </Typography>
        </Box>

        <Box className="flex gap-2">
          <Button 
            variant="outlined" 
            startIcon={<FileDownload />} 
            onClick={handleExportCSV}
            size="small"
          >
            Export CSV
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<FileDownload />} 
            onClick={handleExportExcel}
            size="small"
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Analytical Metric Cards */}
      {metrics && (
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} sm={6} md={2.4}>
            <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
              <CardContent className="p-5 flex items-center justify-between">
                <Box>
                  <Typography variant="caption" className="text-google-gray block font-semibold">Total Users</Typography>
                  <Typography variant="h4" className="font-bold text-google-dark dark:text-white mt-1">{metrics.total_users}</Typography>
                </Box>
                <People className="text-google-blue text-4xl opacity-80" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
              <CardContent className="p-5 flex items-center justify-between">
                <Box>
                  <Typography variant="caption" className="text-google-gray block font-semibold">Applications</Typography>
                  <Typography variant="h4" className="font-bold text-google-dark dark:text-white mt-1">{metrics.total_applications}</Typography>
                </Box>
                <Assignment className="text-google-blue text-4xl opacity-80" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
              <CardContent className="p-5 flex items-center justify-between">
                <Box>
                  <Typography variant="caption" className="text-google-gray block font-semibold">Pending Review</Typography>
                  <Typography variant="h4" className="font-bold text-orange-500 mt-1">{metrics.pending_reviews}</Typography>
                </Box>
                <HourglassEmpty className="text-orange-500 text-4xl opacity-80" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
              <CardContent className="p-5 flex items-center justify-between">
                <Box>
                  <Typography variant="caption" className="text-google-gray block font-semibold">Approved</Typography>
                  <Typography variant="h4" className="font-bold text-google-green mt-1">{metrics.approved_applications}</Typography>
                </Box>
                <CheckCircle className="text-google-green text-4xl opacity-80" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
              <CardContent className="p-5 flex items-center justify-between">
                <Box>
                  <Typography variant="caption" className="text-google-gray block font-semibold">Rejected</Typography>
                  <Typography variant="h4" className="font-bold text-google-red mt-1">{metrics.rejected_applications}</Typography>
                </Box>
                <ErrorOutline className="text-google-red text-4xl opacity-80" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filter and Search Panel */}
      <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
            <TextField
              label="Search Application"
              placeholder="Name, Email, App ID, Registration Number"
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton type="submit" size="small">
                    <Search />
                  </IconButton>
                )
              }}
            />

            <TextField
              select
              label="Filter by Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              fullWidth
              size="small"
              sx={{ maxWidth: { sm: 220 } }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Submitted">Submitted (Pending Payment)</MenuItem>
              <MenuItem value="Payment Under Verification">Payment Under Verification</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </form>
        </CardContent>
      </Card>

      {/* Submission log database table */}
      <TableContainer component={Paper} className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark rounded-xl">
        <Table>
          <TableHead className="bg-google-gray-light/30 dark:bg-white/5">
            <TableRow>
              <TableCell className="font-semibold text-google-dark dark:text-white">Application ID</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white">Applicant Name</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white">Registration ID</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white">Branch & Year</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white">Status</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white">Submission Date</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white" align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-8">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : apps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-8 text-google-gray dark:text-google-gray-light">
                  No contract applications match your search.
                </TableCell>
              </TableRow>
            ) : (
              apps.map((appItem) => {
                let statusChip = <Chip label={appItem.status} size="small" />;
                if (appItem.status === 'Submitted') {
                  statusChip = <Chip label="Pending Payment" color="primary" variant="outlined" size="small" />;
                } else if (appItem.status === 'Payment Under Verification') {
                  statusChip = <Chip label="Pending Verify" color="warning" size="small" />;
                } else if (appItem.status === 'Approved') {
                  statusChip = <Chip label="Approved" color="success" size="small" />;
                } else if (appItem.status === 'Rejected') {
                  statusChip = <Chip label="Rejected" color="error" size="small" />;
                }

                return (
                  <TableRow key={appItem.id} hover className="dark:hover:bg-white/5">
                    <TableCell className="font-medium text-google-dark dark:text-white">{appItem.application_id}</TableCell>
                    <TableCell className="text-google-dark dark:text-white">{appItem.full_name}</TableCell>
                    <TableCell className="text-google-dark dark:text-white">{appItem.registration_number}</TableCell>
                    <TableCell className="text-google-dark dark:text-white">{appItem.branch} (Y-{appItem.year_of_study})</TableCell>
                    <TableCell>{statusChip}</TableCell>
                    <TableCell className="text-google-gray dark:text-google-gray-light">
                      {new Date(appItem.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/admin/applications/${appItem.id}`)}
                        className="py-1 capitalize text-xs"
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
