import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Typography, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const AuditLogs: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-1 md:p-4 max-w-5xl mx-auto">
      {/* Title Header */}
      <Box className="mb-6 flex items-center gap-3">
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => navigate('/admin')} 
          className="border-google-border hover:bg-google-blue-light/10 text-google-dark dark:text-white"
          sx={{ minWidth: 40, p: 0.8, borderRadius: 2 }}
        >
          <ArrowBack fontSize="small" />
        </Button>
        <Box>
          <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            System Audit Logs
          </Typography>
          <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
            Chronological registry of administrative events and payment status overrides.
          </Typography>
        </Box>
      </Box>

      {/* Database logs table */}
      <TableContainer component={Paper} className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark rounded-xl">
        <Table>
          <TableHead className="bg-google-gray-light/30 dark:bg-white/5">
            <TableRow>
              <TableCell className="font-semibold text-google-dark dark:text-white" style={{ width: 100 }}>Log ID</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white" style={{ width: 180 }}>Administrator</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white">Logged Action</TableCell>
              <TableCell className="font-semibold text-google-dark dark:text-white" style={{ width: 220 }}>Timestamp (UTC)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" className="py-8 text-google-gray dark:text-google-gray-light">
                  No system audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover className="dark:hover:bg-white/5">
                  <TableCell className="font-semibold text-google-gray font-mono">{log.id}</TableCell>
                  <TableCell className="font-medium text-google-dark dark:text-white">{log.admin_name}</TableCell>
                  <TableCell className="text-google-dark dark:text-white">{log.action}</TableCell>
                  <TableCell className="text-google-gray dark:text-google-gray-light">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
