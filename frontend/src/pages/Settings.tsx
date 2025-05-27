import React from 'react';
import { Grid } from '@mui/material';
import { ChangePassword } from '../components/ChangePassword';
import { ForgotPassword } from '../components/ForgotPassword';
import { SessionLog } from '../components/SessionLog';

<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <ChangePassword />
  </Grid>
  <Grid item xs={12} md={6}>
    <ForgotPassword />
  </Grid>
  <Grid item xs={12}>
    <SessionLog />
  </Grid>
</Grid> 